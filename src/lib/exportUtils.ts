import { saveAs } from "file-saver";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface Product {
    id?: string;
    name?: string;
    title?: string;
    price: number | null;
    originalPrice?: number | null;
    currency: string;
    rating?: number | null;
    reviewsCount?: number | null;
    source?: string | null;
    summary?: string | null;
    productUrl?: string | null;
    imageUrl?: string | null;
}

interface Filters {
    search: string;
    category: string;
    price: string;
    sort: string;
}

interface ExportOptions {
    products: Product[];
    filters?: Filters;
    currencySymbol: string;
    filename?: string;
    onProgress?: (progress: number) => void;
}

/**
 * Export products to CSV format
 */
export const exportToCSV = async (options: ExportOptions): Promise<void> => {
    const { products, filters, currencySymbol, filename, onProgress } = options;

    try {
        // Prepare CSV headers
        const headers = [
            "Product Name",
            "Price",
            "Original Price",
            "Currency",
            "Rating",
            "Reviews",
            "Source",
            "Summary",
            "Product URL"
        ];

        // Prepare CSV rows
        const rows = products.map((product, index) => {
            if (onProgress) onProgress((index + 1) / products.length * 100);

            return [
                product.name || product.title || "N/A",
                product.price ? `${currencySymbol}${product.price.toLocaleString()}` : "N/A",
                product.originalPrice ? `${currencySymbol}${product.originalPrice.toLocaleString()}` : "N/A",
                product.currency || "USD",
                product.rating ? product.rating.toFixed(1) : "N/A",
                product.reviewsCount?.toString() || "N/A",
                product.source || "N/A",
                product.summary?.replace(/,/g, ";").replace(/\n/g, " ") || "N/A",
                product.productUrl || "N/A"
            ];
        });

        // Combine headers and rows
        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
        ].join("\n");

        // Add BOM for UTF-8 encoding
        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });

        // Generate filename
        const date = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
        const filterInfo = filters?.search ? `_search-${filters.search}` : "";
        const finalFilename = filename || `products_export${filterInfo}_${date}.csv`;

        saveAs(blob, finalFilename);

        if (onProgress) onProgress(100);
    } catch (error) {
        console.error("Error exporting to CSV:", error);
        throw new Error("Failed to export CSV");
    }
};

/**
 * Export products to PDF format
 */
export const exportToPDF = async (options: ExportOptions): Promise<void> => {
    const { products, filters, currencySymbol, filename, onProgress } = options;

    try {
        // Create a temporary div to render the product list for PDF
        const element = document.createElement("div");
        element.style.padding = "20px";
        element.style.backgroundColor = "white";
        element.style.width = "800px";
        element.style.fontFamily = "Arial, sans-serif";

        // Add header
        const header = document.createElement("div");
        const hasActiveFilters = filters && (filters.search || filters.category || filters.price || filters.sort);

        header.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="font-size: 24px; margin-bottom: 10px; color: #333;">Product Export</h1>
        <p style="color: #666; margin-bottom: 5px;">Generated on ${new Date().toLocaleString()}</p>
        ${hasActiveFilters ? `<p style="color: #666; font-size: 12px;">Filters Applied: ${Object.entries(filters).filter(([_, v]) => v).map(([k, v]) => `${k}: ${v}`).join(" | ")}</p>` : ""}
        <p style="color: #666; font-weight: bold;">Total Products: ${products.length}</p>
      </div>
      <hr style="margin: 20px 0; border-color: #ddd;" />
    `;
        element.appendChild(header);

        // Add product grid
        const grid = document.createElement("div");
        grid.style.display = "grid";
        grid.style.gridTemplateColumns = "repeat(2, 1fr)";
        grid.style.gap = "20px";

        products.forEach((product, index) => {
            if (onProgress) onProgress((index + 1) / products.length * 100);

            const card = document.createElement("div");
            card.style.border = "1px solid #e0e0e0";
            card.style.borderRadius = "8px";
            card.style.padding = "15px";
            card.style.backgroundColor = "#fafafa";
            card.style.pageBreakInside = "avoid";

            card.innerHTML = `
        <div style="margin-bottom: 10px;">
          <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 5px; color: #333;">${product.name || product.title || "N/A"}</h3>
          ${product.source ? `<span style="font-size: 12px; color: #888;">${product.source}</span>` : ""}
        </div>
        <div style="margin-bottom: 10px;">
          <strong style="color: #555;">Price:</strong> 
          <span style="color: #2c7da0;">${product.price ? `${currencySymbol}${product.price.toLocaleString()}` : "N/A"}</span>
          ${product.originalPrice ? `<span style="text-decoration: line-through; margin-left: 8px; color: #999;">${currencySymbol}${product.originalPrice.toLocaleString()}</span>` : ""}
        </div>
        ${product.rating ? `
          <div style="margin-bottom: 10px;">
            <strong style="color: #555;">Rating:</strong> 
            <span>${product.rating.toFixed(1)} ★ (${product.reviewsCount || 0} reviews)</span>
          </div>
        ` : ""}
        ${product.summary ? `
          <div style="margin-bottom: 10px;">
            <strong style="color: #555;">Summary:</strong> 
            <span style="color: #666; font-size: 13px;">${product.summary.substring(0, 150)}${product.summary.length > 150 ? "..." : ""}</span>
          </div>
        ` : ""}
        ${product.productUrl ? `
          <div style="margin-top: 10px;">
            <a href="${product.productUrl}" style="color: #2c7da0; font-size: 12px; text-decoration: none;">View Product →</a>
          </div>
        ` : ""}
      `;
            grid.appendChild(card);
        });

        element.appendChild(grid);
        document.body.appendChild(element);

        // Convert to canvas and then to PDF
        const canvas = await html2canvas(element, {
            scale: 2,
            backgroundColor: "#ffffff",
            logging: false
        });

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });

        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        let pageCount = 1;
        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
            pageCount++;
        }

        // Generate filename
        const date = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
        const filterInfo = filters?.search ? `_search-${filters.search}` : "";
        const finalFilename = filename || `products_export${filterInfo}_${date}.pdf`;

        pdf.save(finalFilename);

        // Clean up
        document.body.removeChild(element);

        if (onProgress) onProgress(100);
    } catch (error) {
        console.error("Error exporting to PDF:", error);
        throw new Error("Failed to export PDF");
    }
};

/**
 * Export products to JSON format
 */
export const exportToJSON = async (options: ExportOptions): Promise<void> => {
    const { products, filters, filename, onProgress } = options;

    try {
        const exportData = {
            exportedAt: new Date().toISOString(),
            totalProducts: products.length,
            filters: filters || {},
            products: products.map((product, index) => {
                if (onProgress) onProgress((index + 1) / products.length * 100);

                return {
                    id: product.id,
                    name: product.name || product.title,
                    price: product.price,
                    originalPrice: product.originalPrice,
                    currency: product.currency,
                    rating: product.rating,
                    reviewsCount: product.reviewsCount,
                    source: product.source,
                    summary: product.summary,
                    productUrl: product.productUrl
                };
            })
        };

        const jsonContent = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonContent], { type: "application/json" });

        const date = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
        const filterInfo = filters?.search ? `_search-${filters.search}` : "";
        const finalFilename = filename || `products_export${filterInfo}_${date}.json`;

        saveAs(blob, finalFilename);

        if (onProgress) onProgress(100);
    } catch (error) {
        console.error("Error exporting to JSON:", error);
        throw new Error("Failed to export JSON");
    }
};