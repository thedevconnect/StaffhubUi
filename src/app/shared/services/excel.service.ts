import { Workbook } from 'exceljs';
import { Injectable } from '@angular/core';
import * as FileSaver from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Packer } from 'docx';
// // import { DocumentCreator } from '../shared/reportWord';
import * as ExcelJS from 'exceljs';


@Injectable({
  providedIn: 'root'
})
export class ExcelService {
constructor() { }

public exportAsExcelFile(json: any[], excelFileName: string ,customsheetname = 'data'): void {
  var headerList: any[] = [];
  var headerListN = [];
  var dataList: any[] = [];
  var dataListf: any[] = [];
  json = json.map(item => {
    for (let key in item) {
        // Check if value is a string and contains only digits and an optional decimal point
        if (typeof item[key] === 'string' && /^[0-9.]+$/.test(item[key])) {
            // Convert to number
            item[key] = parseFloat(item[key]);
        }
    }
    return item;
  });
  Object.keys(json[0]).forEach(function (value) {
    headerListN.push(value.toUpperCase());
    headerList.push(value.substring(0, value.indexOf('-') > 0 ? value.indexOf('-') : value.length).toUpperCase());
  });
  Object.keys(json).forEach(function (index:any, key) {
    Object.keys(json[key]).forEach(function (index1, value1) {
      dataList.push(json[index][index1]);        
    });
    dataListf.push(dataList);
    dataList = [];
  });
  const data = dataListf;
  const header = headerList;
  var tt = this.numToSSColumn(headerList.length);
  //Create workbook and worksheet
  let workbook = new Workbook();
  let worksheet = workbook.addWorksheet('Data');

  let titleRow = worksheet.addRow([excelFileName]);
  titleRow.font = {
    name: 'Cambria',
    family: 4,
    size: 14,
    bold: true,
  };
  titleRow.alignment = { horizontal: 'center' };  
  worksheet.addRow([]);
  worksheet.mergeCells(`A${titleRow.number}:${tt}${titleRow.number}`);    
  let headerRow = worksheet.addRow(header);

  // Cell Style : Fill and Border
  headerRow.eachCell((cell: any, number: any) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'ADFF2F' },
      bgColor: { argb: 'FFFFFF' },
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });

  worksheet.addRows(data);

  // Add Data and Conditional Formatting

  worksheet.eachRow({ includeEmpty: true }, (row: ExcelJS.Row, rowNumber: number) => {
    // row.eachCell(function(cell, colNumber){ 
       for (var i = 1; i <= headerListN.length; i++) {          
         row.getCell(i).border = {
         top: {style:'thin'},
         left: {style:'thin'},
         bottom: {style:'thin'},
         right: {style:'thin'}
       };
     }      
  //  });
  });
   
  
  worksheet.columns?.forEach((column: Partial<ExcelJS.Column>) => {
    let maxLength = 0;

    (column as ExcelJS.Column).eachCell({ includeEmpty: true }, (cell: ExcelJS.Cell, colNumber: number) => {
      const columnLength = cell.value ? cell.value.toString().trim().length : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });

    column.width = maxLength < 10 ? 10 : maxLength + 3;
  });

  worksheet.addRow([]);
  //Footer Row
  let footerRow = worksheet.addRow(['This is system generated excel sheet. as on('+new Date()+')']);
  footerRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFCCFFE5' },
  };
  footerRow.getCell(1).border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  };
  //Merge Cells
  worksheet.mergeCells(`A${footerRow.number}:${tt}${footerRow.number}`);   
  // footerRow.alignment = { horizontal: 'center' };
  //Generate Excel File with given name
  workbook.xlsx.writeBuffer().then((data: any) => {
    let blob = new Blob([data], {
      // type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    });
    FileSaver.saveAs(blob, excelFileName + '.xlsx');
  });
}
public exportAsExcelFileWithOrder(dataArray: any[][], excelFileName: string): void {
  if (dataArray.length === 0) {
    return;
  }

  const headers = dataArray[0];
  const dataRows = dataArray.slice(1);
  
  const processedDataRows = dataRows.map(row => {
    return row.map(cell => {
      if (typeof cell === 'string' && /^[0-9.]+$/.test(cell)) {
        return parseFloat(cell);
      }
      return cell;
    });
  });

  var tt = this.numToSSColumn(headers.length);
  

  let workbook = new Workbook();
  let worksheet = workbook.addWorksheet('Data');

  let titleRow = worksheet.addRow([excelFileName]);
  titleRow.font = {
    name: 'Cambria',
    family: 4,
    size: 14,
    bold: true,
  };
  titleRow.alignment = { horizontal: 'center' };  
  worksheet.addRow([]);
  worksheet.mergeCells(`A${titleRow.number}:${tt}${titleRow.number}`);    
  
  let headerRow = worksheet.addRow(headers);

  // Cell Style : Fill and Border
  headerRow.eachCell((cell: ExcelJS.Cell, number: number) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'ADFF2F' },
      bgColor: { argb: 'FFFFFF' },
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });


  worksheet.addRows(processedDataRows);


  worksheet.eachRow({ includeEmpty: true }, (row: ExcelJS.Row, rowNumber: number) => {
    for (var i = 1; i <= headers.length; i++) {          
      row.getCell(i).border = {
        top: {style:'thin'},
        left: {style:'thin'},
        bottom: {style:'thin'},
        right: {style:'thin'}
      };
    }      
  });
   
  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    (column as ExcelJS.Column).eachCell({ includeEmpty: true }, (cell) => {
      const columnLength = cell.value ? cell.value.toString().trim().length : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = maxLength < 10 ? 10 : maxLength + 3;
  });

  worksheet.addRow([]);

  let footerRow = worksheet.addRow(['This is system generated excel sheet. as on('+new Date()+')']);
  footerRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFCCFFE5' },
  };
  footerRow.getCell(1).border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  };

  worksheet.mergeCells(`A${footerRow.number}:${tt}${footerRow.number}`);   
  
  workbook.xlsx.writeBuffer().then((data: any) => {
    let blob = new Blob([data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    });
    FileSaver.saveAs(blob, excelFileName + '.xlsx');
  });
}
public exportExcelMultiTable(jsonArray: any[], excelFileNames: string[],fileName:string): void {
  const workbook = new Workbook();  
  jsonArray.forEach((json, index) => {
    const excelFileName = excelFileNames[index];
    const headerList: any =[];
    const dataListf: any = [];
    Object.keys(json[0]).forEach(function (value) {
      headerList.push(value.substring(0, value.indexOf('-') > 0 ? value.indexOf('-') : value.length).toUpperCase());
    });

    Object.keys(json).forEach(function (index1) {
      const dataList: any = [];
      Object.keys(json[index1]).forEach(function (index2) {
        dataList.push(json[index1][index2]);
      });
      dataListf.push(dataList);
    });

    const data = dataListf;
    var lasColumn = this.numToSSColumn(headerList.length);
    const worksheet = workbook.addWorksheet(excelFileName);

    let titleRow = worksheet.addRow([excelFileName]);
    titleRow.font = {
      name: 'Cambria',
      family: 4,
      size: 14,
      bold: true,
    };
    titleRow.alignment = { horizontal: 'center' };  
    worksheet.addRow([]);
    worksheet.mergeCells(`A${titleRow.number}:${lasColumn}${titleRow.number}`);    
    let headerRow = worksheet.addRow(headerList);
    headerRow.eachCell((cell: any, number: any) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'ADFF2F' },
        bgColor: { argb: 'FFFFFF' },
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    worksheet.addRows(data);

    worksheet.eachRow({ includeEmpty: true }, function(row: any, rowNumber: any){
         for (var i = 1; i <= headerList.length; i++) {          
           row.getCell(i).border = {
           top: {style:'thin'},
           left: {style:'thin'},
           bottom: {style:'thin'},
           right: {style:'thin'}
         };
       }      
    });

    worksheet.columns?.forEach((column: any) => {
      let maxLength = 0;

      (column as ExcelJS.Column).eachCell({ includeEmpty: true }, (cell: any, colNumber: any) => {
        const columnLength = cell.value ? cell.value.toString().trim().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });

      column.width = maxLength < 10 ? 10 : maxLength + 3;
    });

    worksheet.addRow([]);

    let footerRow = worksheet.addRow(['This is system generated excel sheet. as on('+new Date()+')']);
    footerRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFCCFFE5' },
    };
    footerRow.getCell(1).border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
    //Merge Cells
    worksheet.mergeCells(`A${footerRow.number}:${lasColumn}${footerRow.number}`);  
  });

  workbook.xlsx.writeBuffer().then((data: any) => {
    const blob = new Blob([data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    });
    FileSaver.saveAs(blob, fileName + '.xlsx');
  });
}

private saveAsExcelFile(buffer: any, fileName: string): void {
  //  const data: Blob = new Blob([buffer], {type: EXCEL_TYPE});
  //  FileSaver.saveAs(data, fileName + '_export_' + new  Date().getTime() + EXCEL_EXTENSION);
}


  public exportAsPDFFile(columns: any[], data: any[], fileName: string) {
    // var doc = new jspdf('p', 'pt');
    // doc.autoTable(columns, data, {theme :'plain'});
    // doc.save(fileName + '_pdf_' + new  Date().getTime() +'.pdf');
  }

  // exportAsDoc removed as it requires reportWord

public numToSSColumn(num:any) {
  let s = '',
    t;
  while (num > 0) {
    t = (num - 1) % 26;
    s = String.fromCharCode(65 + t) + s;
    num = ((num - t) / 26) | 0;
  }
  return s || undefined;
}

headerStyle(headerChildRow:any){
  headerChildRow.eachCell((cell:any, number:any) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'F5F5F5' },
      bgColor: { argb: 'FFFFFF' },
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
    cell.font = {
      size: 12,
      bold: false,
      
    };
    headerChildRow.height = 20; // Set the row height
    headerChildRow.alignment = { vertical: 'middle', horizontal: 'center' };
  });
}
dataStyle(dataChildRow:any){
  dataChildRow.eachCell((cell:any, number:any) => {
    dataChildRow.alignment = {horizontal: 'left' };
  });
}

async generateExcelWithGroup(data:any,tblName:any) {
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet(tblName);
  // worksheet.properties.outlineSummaryBelow = false;
  const mainHeaders = Object.keys(data[0]).filter(key => key !== 'id' && key !== 'table1' && key !== 'table2' && key !== 'table3' && key !== 'table4');
  const table1Headers = data.find((d: any) => d.table1.length > 0)?.table1.length ? Object.keys(data.find((d: any) => d.table1.length > 0)?.table1[0]) : [];
  const table2Headers = data.find((d: any) => d.table2.length > 0)?.table2.length ? Object.keys(data.find((d: any) => d.table2.length > 0)?.table2[0]) : [];
  const table3Headers = data.find((d: any) => d.table3.length > 0)?.table3.length ? Object.keys(data.find((d: any) => d.table3.length > 0)?.table3[0]) : [];
  const table4Headers = data.find((d: any) => d.table4.length > 0)?.table4.length ? Object.keys(data.find((d: any) => d.table4.length > 0)?.table4[0]) : [];
  // Add header row for main records
  var lasColumn = this.numToSSColumn(mainHeaders.length);  
      let titleRow = worksheet.addRow([tblName]);
      titleRow.font = {
        name: 'Cambria',
        family: 4,
        size: 14,
        bold: true,
      };
      titleRow.alignment = { horizontal: 'center' };  
      // worksheet.addRow([]);
      worksheet.mergeCells(`A${titleRow.number}:${lasColumn}${titleRow.number}`);   
      let headerRow = worksheet.addRow([...mainHeaders]);
      headerRow.eachCell((cell: any, number: any) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'ADFF2F' },
          bgColor: { argb: 'FFFFFF' },
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        headerRow.height = 20; // Set the row height
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      });
  

  data.forEach((record:any) => {
    const mainData = mainHeaders.map(header => record[header]);
    const mainRow = worksheet.addRow(mainData);   
    this.dataStyle(mainRow)  
    mainRow.outlineLevel = 0; 
    // mainRow.collapsed = true;
    // Add an empty row to control the outline
    const controlRow = worksheet.addRow([]);
    controlRow.outlineLevel = 1;
    controlRow.hidden = true;


    // Add table1 header and rows if table1 is not empty
    if (record.table1 && record.table1.length > 0) {        
      const table1HeaderRow = worksheet.addRow([...table1Headers]);
      this.headerStyle(table1HeaderRow)     
      table1HeaderRow.outlineLevel = 1; // Set outline level for grouping
      table1HeaderRow.hidden = true;

      record.table1.forEach((item:any) => {
        const itemData = table1Headers.map(header => item[header]);
        const itemRow = worksheet.addRow([...itemData]);
        this.dataStyle(itemRow)  
        itemRow.outlineLevel = 1; // Set outline level to group the rows
        itemRow.hidden = true;
      });
      const bRow = worksheet.addRow([]); 
      bRow.outlineLevel = 1;
      bRow.hidden = true;

    }
    // Add table2 header and rows if table2 is not empty
    if (record.table2 && record.table2.length > 0) {
      const table2HeaderRow = worksheet.addRow([...table2Headers]);
      this.headerStyle(table2HeaderRow)
      table2HeaderRow.outlineLevel = 1; // Set outline level for grouping
      table2HeaderRow.hidden = true;

      record.table2.forEach((item:any) => {
        const itemData = table2Headers.map(header => item[header]);
        const itemRow = worksheet.addRow([...itemData]);
        this.dataStyle(itemRow)  
        itemRow.outlineLevel = 1; // Set outline level to group the rows    
        itemRow.hidden = true;
      });
      const bRow = worksheet.addRow([]); 
      bRow.outlineLevel = 1;
      bRow.hidden = true;
    }
    // Add table3 header and rows if table3 is not empty
    if (record.table3 && record.table3.length > 0) {
      const table3HeaderRow = worksheet.addRow([...table3Headers]);
      this.headerStyle(table3HeaderRow)
      table3HeaderRow.outlineLevel = 1; // Set outline level for grouping
      table3HeaderRow.hidden = true;

      record.table3.forEach((item:any) => {
        const itemData = table3Headers.map(header => item[header]);
        const itemRow = worksheet.addRow([...itemData]);
        this.dataStyle(itemRow)  
        itemRow.outlineLevel = 1; // Set outline level to group the rows  
        itemRow.hidden = true;
      });
      const bRow = worksheet.addRow([]); 
      bRow.outlineLevel = 1;
      bRow.hidden = true;
    }
    // Add table4 header and rows if table4 is not empty
    if (record.table4 && record.table4.length > 0) {
      const table4HeaderRow = worksheet.addRow([...table4Headers]);
      this.headerStyle(table4HeaderRow)
      table4HeaderRow.outlineLevel = 1; // Set outline level for grouping
      table4HeaderRow.hidden = true;

      record.table4.forEach((item:any) => {
        const itemData = table4Headers.map(header => item[header]);
        const itemRow = worksheet.addRow([...itemData]);
        this.dataStyle(itemRow)  
        itemRow.outlineLevel = 1; // Set outline level to group the rows
        itemRow.hidden = true;
      });
      const bRow = worksheet.addRow([]); 
      bRow.outlineLevel = 1;
      bRow.hidden = true;
    }
  });

  // Set column widths
  worksheet.columns?.forEach((column) => {
    let maxLength = 0;

    (column as ExcelJS.Column).eachCell({ includeEmpty: true }, (cell: any, colNumber: any) => {
      const columnLength = cell.value ? cell.value.toString().trim().length : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });

    column.width = maxLength < 10 ? 10 : maxLength + 3;
  });


  worksheet.addRow([]);
  worksheet.addRow([]);
  worksheet.addRow([]);

  let footerRow = worksheet.addRow(['This is system generated excel sheet. as on('+new Date()+')']);
  footerRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFCCFFE5' },
  };
  footerRow.getCell(1).border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  };
  //Merge Cells
  worksheet.mergeCells(`A${footerRow.number}:${lasColumn}${footerRow.number}`);  

  // Save the workbook
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  FileSaver.saveAs(blob, tblName + '.xlsx');
}

async generateExcelWithGroupERP(data:any,tblName:any) {
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet(tblName);
  // worksheet.properties.outlineSummaryBelow = false;
  const mainHeaders = Object.keys(data[0]).filter(key => key !== 'details');
  const table1Headers = data.find((d:any) => d.details.length > 0)?.details.length ? Object.keys(data.find((d:any) => d.details.length > 0)?.details[0]) : [];
  var lasColumn = this.numToSSColumn(mainHeaders.length);  
      let titleRow = worksheet.addRow([tblName]);
      titleRow.font = {
        name: 'Cambria',
        family: 4,
        size: 14,
        bold: true,
      };
      titleRow.alignment = { horizontal: 'center' };  
      // worksheet.addRow([]);
      worksheet.mergeCells(`A${titleRow.number}:${lasColumn}${titleRow.number}`);   
      let headerRow = worksheet.addRow([...mainHeaders]);
      headerRow.eachCell((cell: any, number: any) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'ADFF2F' },
          bgColor: { argb: 'FFFFFF' },
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        headerRow.height = 20; // Set the row height
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      });
  

  data.forEach((record:any) => {
    const mainData = mainHeaders.map(header => record[header]);
    const mainRow = worksheet.addRow(mainData);   
    this.dataStyle(mainRow)  
    mainRow.outlineLevel = 0; 
    // worksheet.addRow([]);
    // Add an empty row to control the outline
    const controlRow = worksheet.addRow([]);
    controlRow.outlineLevel = 1;
    controlRow.hidden = true;

    // Add table1 header and rows if table1 is not empty
    if (record.details && record.details.length > 0) {        
      const table1HeaderRow = worksheet.addRow([...table1Headers]);
      this.headerStyle(table1HeaderRow)     
      table1HeaderRow.outlineLevel = 1; // Set outline level for grouping
      table1HeaderRow.hidden = true;

      record.details.forEach((item:any) => {
        const itemData = table1Headers.map(header => item[header]);
        const itemRow = worksheet.addRow([...itemData]);
        this.dataStyle(itemRow)  
        itemRow.outlineLevel = 1; // Set outline level to group the rows
        itemRow.hidden = true;
      });
      const bRow = worksheet.addRow([]); 
      bRow.outlineLevel = 1;
      bRow.hidden = true;

    }
  });

  // Set column widths
  worksheet.columns?.forEach((column) => {
    let maxLength = 0;

    (column as ExcelJS.Column).eachCell({ includeEmpty: true }, (cell: any, colNumber: any) => {
      const columnLength = cell.value ? cell.value.toString().trim().length : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });

    column.width = maxLength < 10 ? 10 : maxLength + 3;
  });

  worksheet.addRow([]);
  worksheet.addRow([]);
  worksheet.addRow([]);

  let footerRow = worksheet.addRow(['This is system generated excel sheet. as on('+new Date()+')']);
  footerRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFCCFFE5' },
  };
  footerRow.getCell(1).border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  };
  //Merge Cells
  worksheet.mergeCells(`A${footerRow.number}:${lasColumn}${footerRow.number}`);  

  // Save the workbook
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  FileSaver.saveAs(blob, tblName + '.xlsx');
}

async generateExcelWithGroupVendor(data:any,tblName:any) {
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet(tblName);
  // worksheet.properties.outlineSummaryBelow = false;
  const mainHeaders = Object.keys(data[0]).filter(key => key !== 'address');
  const arr = data.find((d: any) => d.address.length > 0)?.address.length ? Object.keys(data.find((d:any) => d.address.length > 0)?.address[0]) : [];
  const table1Headers = arr.filter(key => key !== 'contact');
  for(let i = 0; i< data[i].address.length; i++) {
    var table2Headers = data.find((d: any) => d.address[i].contact.length > 0)?.address[i].contact.length ? Object.keys(data.find((d: any) => d.address[i].contact.length > 0)?.address[i].contact[0]) : [];
  }
  
  var lasColumn = this.numToSSColumn(mainHeaders.length);  
      let titleRow = worksheet.addRow([tblName]);
      titleRow.font = {
        name: 'Cambria',
        family: 4,
        size: 14,
        bold: true,
      };
      titleRow.alignment = { horizontal: 'center' };  
      // worksheet.addRow([]);
      worksheet.mergeCells(`A${titleRow.number}:${lasColumn}${titleRow.number}`);   
      let headerRow = worksheet.addRow([...mainHeaders]);
      headerRow.eachCell((cell: any, number: any) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'ADFF2F' },
          bgColor: { argb: 'FFFFFF' },
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        headerRow.height = 20; // Set the row height
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      });

   data.forEach((record:any) => {
    const mainData = mainHeaders.map(header => record[header]);
    const mainRow = worksheet.addRow(mainData);   
    this.dataStyle(mainRow)  
    mainRow.outlineLevel = 0; 
    // worksheet.addRow([]);
    // Add an empty row to control the outline
    const controlRow = worksheet.addRow([]);
    controlRow.outlineLevel = 1;
    controlRow.hidden = true;

    // Add table1 header and rows if table1 is not empty
    if (record.address && record.address.length > 0) {        
      const table1HeaderRow = worksheet.addRow([...table1Headers]);
      this.headerStyle(table1HeaderRow)     
      table1HeaderRow.outlineLevel = 1; // Set outline level for grouping
      table1HeaderRow.hidden = true;

      record.address.forEach((item:any) => {
      const itemData = table1Headers.map(header => item[header]);
      const itemRow = worksheet.addRow([...itemData]);
      this.dataStyle(itemRow)  
      itemRow.outlineLevel = 1; // Set outline level to group the rows
      itemRow.hidden = true;

      if(item.contact && item.contact.length > 0)
      {
      const table2HeaderRow = worksheet.addRow([...table2Headers]);
      this.headerStyle(table2HeaderRow)     
      table2HeaderRow.outlineLevel = 2; // Set outline level for grouping
      table2HeaderRow.hidden = true;  

      item.contact.forEach((item:any) => {
      const itemData = table2Headers.map(header => item[header]);
      const itemRow = worksheet.addRow([...itemData]);
      this.dataStyle(itemRow)  
      itemRow.outlineLevel = 2; // Set outline level to group the rows
      itemRow.hidden = true;
     });

     const bRow = worksheet.addRow([]); 
      bRow.outlineLevel = 2;
      bRow.hidden = true;
    }

    });

      const bRow = worksheet.addRow([]); 
      bRow.outlineLevel = 1;
      bRow.hidden = true;
    }

});

  // Set column widths
  worksheet.columns?.forEach((column) => {
    let maxLength = 0;

    (column as ExcelJS.Column).eachCell({ includeEmpty: true }, (cell: any, colNumber: any) => {
      const columnLength = cell.value ? cell.value.toString().trim().length : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });

    column.width = maxLength < 10 ? 10 : maxLength + 3;
  });


  worksheet.addRow([]);
  worksheet.addRow([]);
  worksheet.addRow([]);

  let footerRow = worksheet.addRow(['This is system generated excel sheet. as on('+new Date()+')']);
  footerRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFCCFFE5' },
  };
  footerRow.getCell(1).border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  };
  //Merge Cells
  worksheet.mergeCells(`A${footerRow.number}:${lasColumn}${footerRow.number}`);  

  // Save the workbook
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  FileSaver.saveAs(blob, tblName + '.xlsx');
}
}
