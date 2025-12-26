function svgToPng(svgElement) {
  if (!svgElement) {
    return Promise.reject(new Error('SVG element not found'));
  }
  
  // Get width and height from SVG attributes
  var width = parseFloat(svgElement.getAttribute('width')) || 300;
  var height = parseFloat(svgElement.getAttribute('height')) || 150;
  
  // Create a canvas
  var canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  var ctx = canvas.getContext('2d');
  
  // Serialize the SVG to a string
  var svgData = new XMLSerializer().serializeToString(svgElement);
  
  var DOMURL = window.URL || window.webkitURL || window;
  
  var img = new Image();
  var svg = new Blob([svgData], {type: 'image/svg+xml'});
  var url = DOMURL.createObjectURL(svg);
  
  return new Promise((resolve, reject) => {
    img.onload = function () {
      ctx.drawImage(img, 0, 0);
      DOMURL.revokeObjectURL(url);
      var png_img = canvas.toDataURL("image/png");
      resolve(png_img);
    };
    
    img.onerror = function() {
      DOMURL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG image'));
    };
    
    img.src = url;
  });
}