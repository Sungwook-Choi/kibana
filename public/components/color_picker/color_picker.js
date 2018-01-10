import React from 'react';
import PropTypes from 'prop-types';
import { ColorPalette } from '../color_palette';
import { ColorManager } from '../color_manager';

export const ColorPicker = ({ onChange, value, colors, addColor, removeColor }) => {

  return (
    <div>
      <ColorPalette onChange={onChange} value={value} colors={colors} />
      <ColorManager onChange={onChange} value={value} addColor={addColor} removeColor={removeColor}/>
    </div>
  );
};

ColorPicker.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  colors: PropTypes.array,
  addColor: PropTypes.func,
  removeColor: PropTypes.func,
};
