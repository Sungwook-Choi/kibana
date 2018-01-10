import { uniq, map, get, groupBy, sortBy, mapValues } from 'lodash';
import keyBy from 'lodash.keyby';

const getResultValues = (items, name, sorter) => {
  const vals = uniq(map(items, name).filter(v => v !== undefined));
  return sorter ? sortBy(vals, sorter) : vals.sort();
};

export const grid = {
  name: 'grid',
  aliases: [],
  type: 'render',
  help: 'Creates a renderable element represented by a grid of icons or values. Similar to a heat map',
  context: {
    types: [
      'pointseries',
    ],
  },
  args: {
    mark: {
      types: ['string', 'null'],
      help: 'The icon name to use for marks in the grid',
    },
    palette: {
      types: ['palette', 'null'],
      help: 'A palette object for describing the colors to use in the grid',
      default: '{palette}',
    },
    seriesStyle: {
      multi: true,
      types: ['seriesStyle', 'null'],
      help: 'A style of a specific series',
    },
    font: {
      types: ['style'],
      default: '{font}',
      help: 'Font style',
    },
  },
  fn: (context, args) => {
    const { font } = args;
    // Create a header array. We can determine the header by looking at X and Y. Its possible we won't have either
    // In which case we have a table with a single row and single column and no header right?
    const resultColumns = getResultValues(context.rows, 'x');
    const seriesStyles = keyBy(args.seriesStyle || [], 'label') || {};

    // If there are no columns, add an "all" column
    if (resultColumns.length === 0) resultColumns.push('');

    function getConsolidateRow(rows, label) {
      const cells = resultColumns.map((column) => {
        // If there was a y value we could also filter for that. Nice.
        const marks = (!context.columns.x) ? rows : rows.reduce((acc, row) => {
          if (row.x === column) {
            const seriesStyle = seriesStyles[row.color];

            acc.push({
              ...row,
              style: {
                color: get(seriesStyle, 'color'),
              },
            });
          }

          return acc;
        }, []);

        return sortBy(marks, 'text');
      });

      return {
        label,
        cells,
      };
    }

    function getConsolidatedRows(rows) {
      const groupedRows = groupBy(rows, 'y');
      return Object.keys(groupedRows).map(val => getConsolidateRow(groupedRows[val], val));
    }

    // If there is no "y" then there exists only one row. How do we get it?
    // We can also filter the rows by 'y' above.
    const resultRows = (context.columns.y)
      ? getConsolidatedRows(context.rows)
      : [getConsolidateRow(context.rows)];

    const summary = mapValues(context.columns, (val, name) => {
      if (!val) return;
      return {
        ...val,
        values: getResultValues(context.rows, name, val => val),
      };
    });

    return {
      type: 'render',
      as: 'grid',
      value: {
        mark: args.mark,
        palette: args.palette,
        columns: resultColumns,
        rows: sortBy(resultRows, 'label'),
        summary,
        font,
      },
    };
  },
};
