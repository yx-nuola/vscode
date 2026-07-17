// import { describe, expect, test } from 'vitest';
// import { DataParser } from './data-parser';
// import type { DataType, MatrixData } from '../types';

// describe('DataParser.parseRRAMData', () => {
//   test('accepts demo data without declared dimensions', () => {
//     const data: DataType = {
//       metadata: {
//         date: '2026-05-16',
//       },
//       cells: [
//         { bl: 4, wl: 4, vset: '1.2', vreset: '0.5', imeas: '8.5', status: 'pass' },
//       ],
//     };

//     expect(DataParser.validateData(data)).toBe(true);

//     const matrixData = DataParser.parseRRAMData(data);

//     expect(matrixData.rows).toBe(5);
//     expect(matrixData.cols).toBe(5);
//   });

//   test('keeps declared dimensions when the file is larger than the default bitmap', () => {
//     const data: DataType = {
//       rows: 100,
//       cols: 128,
//       metadata: {
//         total: 1,
//         date: '2026-05-16',
//         mode: 'test',
//       },
//       cells: [
//         { bl: 99, wl: 127, vset: 1, vreset: 0, imeas: '8.5', status: 'pass' },
//       ],
//     };

//     const matrixData = DataParser.parseRRAMData(data);

//     expect(matrixData.rows).toBe(100);
//     expect(matrixData.cols).toBe(128);
//     expect(matrixData.cells[0]).toMatchObject({
//       row: 99,
//       col: 127,
//       value: 8.5,
//     });
//   });

//   test('expands dimensions to include sparse cells beyond the declared size', () => {
//     const data: DataType = {
//       rows: 64,
//       cols: 64,
//       metadata: {
//         total: 1,
//         date: '2026-05-16',
//         mode: 'test',
//       },
//       cells: [
//         { bl: 100, wl: 128, vset: 1, vreset: 0, imeas: 12, status: 'pass' },
//       ],
//     };

//     const matrixData = DataParser.parseRRAMData(data);

//     expect(matrixData.rows).toBe(101);
//     expect(matrixData.cols).toBe(129);
//   });
// });

// describe('DataParser.mergeData', () => {
//   test('uses the maximum merged cell coordinates when appended sparse cells are not sorted', () => {
//     const existingData: MatrixData = {
//       rows: 64,
//       cols: 64,
//       cells: [
//         { row: 0, col: 0, value: 1 },
//       ],
//     };
//     const newData: MatrixData = {
//       rows: 5,
//       cols: 127,
//       cells: [
//         { row: 2, col: 126, value: 3 },
//         { row: 4, col: 9, value: 4 },
//       ],
//     };

//     const mergedData = DataParser.mergeData(existingData, newData);

//     expect(mergedData.rows).toBe(64);
//     expect(mergedData.cols).toBe(127);
//   });
// });
