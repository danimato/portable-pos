printArea = document.getElementById('printArea');

async function showBarcodeOfSelected(type = 'print') {
    const selectedCount = selectedRows.length;
    if (selectedCount === 0) {
        alert('No items selected for barcode printing.');
        return;
    }
    if (type == 'print') {
        // Clear print area first
        printArea.innerHTML = '';
        
        const imageLoadPromises = [];
        
        // Generate barcodes for each selected product
        for (const productId of selectedRows) {
            const base64Image = await generateBarcodeURL(productId);
            
            if (base64Image) {
                // Load the first image to get actual dimensions
                const tempImg = new Image();
                
                await new Promise((resolve, reject) => {
                    tempImg.onload = () => resolve();
                    tempImg.onerror = () => reject(new Error('Failed to load image'));
                    tempImg.src = base64Image;
                });
                
                // Now we have the actual image dimensions
                const imageWidth = tempImg.width;
                const imageHeight = tempImg.height;
                const dpi = 192;
                
                // Paper settings
                const paperWidth = 8.5;   // inches
                const paperHeight = 11;   // inches
                const margin = 0;      // inches
                const gap = 0;          // inches
                
                // Convert image dimensions to inches
                const imageWidthInches = imageWidth / dpi;
                const imageHeightInches = imageHeight / dpi;
                
                // Calculate usable area in inches
                const usableWidth = paperWidth - (2 * margin);
                const usableHeight = paperHeight - (2 * margin);
                
                // Calculate how many fit with gaps
                const cols = Math.floor((usableWidth + gap) / (imageWidthInches + gap));
                const rows = Math.floor((usableHeight + gap) / (imageHeightInches + gap));
                const totalTiles = cols * rows;
                
                console.log(`Image dimensions: ${imageWidth}x${imageHeight}px (${imageWidthInches.toFixed(2)}x${imageHeightInches.toFixed(2)}in)`);
                console.log(`Grid: ${cols} cols x ${rows} rows = ${totalTiles} total`);
                
                // Create grid container for this product
                const grid = document.createElement('div');
                grid.className = 'tile-grid';
                grid.style.display = 'grid';
                grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
                grid.style.gap = `${gap}in`;
                
                // Fill the grid with copies of this barcode
                for (let i = 0; i < totalTiles; i++) {
                    const img = document.createElement('img');
                    img.src = base64Image;
                    img.alt = `Barcode ${productId}`;
                    
                    // Create a promise that resolves when image loads
                    const loadPromise = new Promise((resolve, reject) => {
                        img.onload = () => resolve();
                        img.onerror = () => reject(new Error(`Failed to load barcode for ${productId}`));
                    });
                    
                    imageLoadPromises.push(loadPromise);
                    grid.appendChild(img);
                }
                
                printArea.appendChild(grid);
            }
        }
        
        // Wait for all images to load
        try {
            await Promise.all(imageLoadPromises);
            console.log(`All ${imageLoadPromises.length} barcodes loaded, ready to print`);
            
            // Small delay to ensure rendering is complete
            setTimeout(() => {
                window.print();
            }, 100);
        } catch (error) {
            console.error('Error loading barcodes:', error);
            alert('Some barcodes failed to load. Please try again.');
        }
    } else if (type == 'png') {
        for (const productId of selectedRows) {
            const base64Image = await generateBarcodeURL(productId);
            if (base64Image) {
                await base64ToFile(base64Image, `barcode_${productId}.png`);
            }
        }
    } 
}

async function generateBarcodeURL(productId) {
    const product = await db.get("products", Number(productId));
    console.log(product);

    if (!product) {
        console.error('Product not found for ID:', productId);
        return null;
    }

    const barcodeData = product.sku;

    JsBarcode("#barcode", barcodeData, {
        format: "CODE128",
        lineColor: "rgba(0, 0, 0, 1)",
        width: 2,
        height: 50
    });

    // Wait for rendering and return the PNG data URL
    return new Promise((resolve) => {
        requestAnimationFrame(() => {
            requestAnimationFrame(async () => {
                const pngDataUrl = await svgToPng(document.getElementById("barcode"));
                console.log("PNG Data URL:", pngDataUrl);
                resolve(pngDataUrl);
            });
        });
    });
}




// Core function to tile an image in the print area
function tileImageForPrint(base64String, imageWidth, imageHeight, options = {}) {
    const {
        paperWidth = 8.5,      // inches
        paperHeight = 11,      // inches
        margin = 0.5,          // inches
        gap = 0.1,             // inches between images
        dpi = 96               // dots per inch
    } = options;

    // Calculate usable print area in pixels
    const usableWidth = (paperWidth - 2 * margin) * dpi;
    const usableHeight = (paperHeight - 2 * margin) * dpi;

    // Calculate how many tiles fit
    const cols = Math.floor((usableWidth + gap * dpi) / (imageWidth + gap * dpi));
    const rows = Math.floor((usableHeight + gap * dpi) / (imageHeight + gap * dpi));
    const totalTiles = cols * rows;

    // Get or create print area
    let printArea = document.getElementById('printArea');
    if (!printArea) {
        printArea = document.createElement('div');
        printArea.id = 'printArea';
        document.body.appendChild(printArea);
    }

    // Clear existing content
    printArea.innerHTML = '';

    // Create grid container
    const grid = document.createElement('div');
    grid.className = 'tile-grid';
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    grid.style.gap = `${gap}in`;

    // Add images
    for (let i = 0; i < totalTiles; i++) {
        const img = document.createElement('img');
        img.src = base64String;
        img.alt = `Tile ${i + 1}`;
        grid.appendChild(img);
    }

    printArea.appendChild(grid);

    return {
        cols,
        rows,
        totalTiles,
        printArea
    };
}

async function base64ToFile(base64String, filename) {
  const response = await fetch(base64String);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  
  URL.revokeObjectURL(url); // Clean up
}