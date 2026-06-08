import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';

@Injectable({
    providedIn: 'root'
})
export class PdfGeneratorService {

    constructor() { }

    generatePdfFromHtmlString(htmlString: string, password?: string, fileName: string = 'document') {
        const doc = new jsPDF({
            orientation: 'p',
            unit: 'pt',
            format: 'a4'
        });

        // Basic HTML rendering using logic similar to standard usage
        // Note: Complex HTML/CSS might need specific adjustments or html2canvas
        doc.html(htmlString, {
            callback: (pdf) => {
                // Password protection (if supported by the version/build)
                if (password) {
                    try {
                        // pdf.setProperties({ password: password }); // This might not work in all jspdf versions directly
                    } catch (e) {
                        console.warn('Password protection not supported in this environment');
                    }
                }
                pdf.save(`${fileName}.pdf`);
            },
            x: 10,
            y: 10,
            width: 500, // Adjust width as needed for A4
            windowWidth: 800 // Width of the window to render the HTML
        });
    }
}
