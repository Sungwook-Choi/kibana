import { handleActions } from 'redux-actions';
import { get } from 'lodash';
import { assign, push, del, set } from 'object-path-immutable';
import * as actions from '../actions/elements';

function getPageIndexById(workpadState, pageId) {
  return get(workpadState, 'pages', []).findIndex(page => page.id === pageId);
}

function getElementIndexById(page, elementId) {
  return page.elements.findIndex(element => element.id === elementId);
}

function assignElementProperties(workpadState, pageId, elementId, props) {
  const pageIndex = getPageIndexById(workpadState, pageId);
  const elementsPath = ['pages', pageIndex, 'elements'];
  const elementIndex = get(workpadState, elementsPath, []).findIndex(element => element.id === elementId);

  if (pageIndex === -1 || elementIndex === -1) return workpadState;

  // remove any AST value from the element caused by https://github.com/elastic/kibana-canvas/issues/260
  // TODO: remove this after a bit of time
  const cleanWorkpadState = del(workpadState, elementsPath.concat([elementIndex, 'ast']));

  return assign(cleanWorkpadState, elementsPath.concat(elementIndex), props);
}

function moveElementLayer(workpadState, pageId, elementId, movement) {
  const pageIndex = getPageIndexById(workpadState, pageId);
  const elementIndex = getElementIndexById(workpadState.pages[pageIndex], elementId);
  const elements = get(workpadState, ['pages', pageIndex, 'elements']);
  const from = elementIndex;

  const to = (function () {
    if (movement < Infinity && movement > -Infinity) return elementIndex + movement;
    if (movement === Infinity) return elements.length - 1;
    if (movement === -Infinity) return 0;
    throw new Error('Invalid element layer movement');
  }());

  if (to > elements.length - 1 || to < 0) return workpadState;

  // Common
  const newElements = elements.slice(0);
  newElements.splice(to, 0, newElements.splice(from, 1)[0]);

  return set(workpadState, ['pages', pageIndex, 'elements'], newElements);
}

export const elementsReducer = handleActions({
  // TODO: This takes the entire element, which is not neccesary, it could just take the id.
  [actions.setExpression]: (workpadState, { payload }) => {
    const { expression, pageId, elementId } = payload;
    return assignElementProperties(workpadState, pageId, elementId, { expression });
  },
  [actions.setFilter]: (workpadState, { payload }) => {
    const { filter, pageId, elementId } = payload;
    return assignElementProperties(workpadState, pageId, elementId, { filter });
  },
  [actions.setPosition]: (workpadState, { payload }) => {
    const { position, pageId, elementId } = payload;
    return assignElementProperties(workpadState, pageId, elementId, { position });
  },
  [actions.elementLayer]: (workpadState, { payload: { pageId, elementId, movement } }) => {
    return moveElementLayer(workpadState, pageId, elementId, movement);
  },
  [actions.addElement]: (workpadState, { payload: { pageId, element } }) => {
    const pageIndex = getPageIndexById(workpadState, pageId);
    if (pageIndex < 0) return workpadState;

    return push(workpadState, ['pages', pageIndex, 'elements'], element);
  },
  [actions.duplicateElement]: (workpadState, { payload: { pageId, element } }) => {
    const pageIndex = getPageIndexById(workpadState, pageId);
    if (pageIndex < 0) return workpadState;

    return push(workpadState, ['pages', pageIndex, 'elements'], element);
  },
  [actions.removeElement]: (workpadState, { payload: { pageId, elementId } }) => {
    const pageIndex = getPageIndexById(workpadState, pageId);
    if (pageIndex < 0) return workpadState;

    const elementIndex = getElementIndexById(workpadState.pages[pageIndex], elementId);
    if (elementIndex < 0) return workpadState;

    return del(workpadState, ['pages', pageIndex, 'elements', elementIndex]);
  },
}, {});
