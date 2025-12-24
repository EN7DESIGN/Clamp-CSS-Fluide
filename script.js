/* =========================================
   Application State & Configuration
   ========================================= */
const state = {
    unit: 'rem', // 'px' or 'rem'
    baseRem: 16
};

/* =========================================
   DOM Elements References
   ========================================= */
const els = {
    minWidth: document.getElementById('minWidth'),
    maxWidth: document.getElementById('maxWidth'),
    minVal: document.getElementById('minVal'),
    maxVal: document.getElementById('maxVal'),
    property: document.getElementById('property'),
    output: document.getElementById('output'),
    labelUnitMin: document.getElementById('label-unit-min'),
    labelUnitMax: document.getElementById('label-unit-max'),
    btnPx: document.getElementById('btn-px'),
    btnRem: document.getElementById('btn-rem'),

    // Previews


    boxMax: document.getElementById('box-max'),
    iframeMax: document.getElementById('iframe-max'),
    infoMax: document.getElementById('info-max')
};

/* =========================================
   Iframe Content Template
   ========================================= */
/**
 * Generates the HTML string to be injected into preview iframes.
 * Styles are included directly to ensure self-containment within the iframe.
 * The closing tags are escaped to prevent HTML parser issues in the parent document.
 */
function getIframeContent() {
    return `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <style>
                body {
                    margin: 0;
                    padding: 20px;
                    font-family: sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    box-sizing: border-box;
                    background: #f4f4f9;
                    overflow: hidden; /* Hide scrollbars inside */
                }
                
                /* --- Visualization Modes --- */

                /* 1. Text Mode (font-size) */
                .mode-text { text-align: center; color: #333; line-height: 1.2; }

                /* 2. Box Mode (width/height) */
                .mode-box {
                    background: linear-gradient(45deg, #4facfe, #00f2fe);
                    box-shadow: 0 10px 20px rgba(0,0,0,0.2);
                    border-radius: 12px;
                    display: flex; align-items: center; justify-content: center;
                    color: white; font-weight: bold;
                    width: 100px; height: 100px; /* Default Fallback */
                }

                /* 3. Padding Mode */
                .mode-padding {
                    background: #ddd;
                    border: 1px dashed #999;
                    display: inline-block;
                }
                .padding-inner {
                    background: #4facfe;
                    width: 80px; height: 80px;
                    border-radius: 4px;
                    display: flex; align-items: center; justify-content: center;
                    color: white; font-size: 0.8rem;
                }

                /* 4. Gap Mode */
                .mode-gap {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    background: #ddd;
                    padding: 10px;
                    border-radius: 8px;
                }
                .gap-item {
                    width: 50px; height: 50px;
                    background: #ff6b6b;
                    border-radius: 8px;
                    display: flex; align-items: center; justify-content: center;
                    color: white; font-weight: bold;
                }
            <\/style>
        <\/head>
        <body>
            <div id="targetElement">Preview<\/div>
        <\/body>
        <\/html>
    `;
}

/**
 * Initializes both preview iframes with the base HTML content.
 */
function initIframes() {
    const frame = els.iframeMax;
    const doc = frame.contentDocument || frame.contentWindow.document;
    doc.open();
    doc.write(getIframeContent());
    doc.close();
}

/* =========================================
   Core Logic & Calculation
   ========================================= */

/**
 * Switches the global unit mode between 'px' and 'rem'.
 * Triggers UI updates and recalculation.
 */
function setUnit(u) {
    state.unit = u;
    updateUI();
    calculate();
}

/**
 * Updates UI elements (toggle buttons, labels) based on current state.
 */
function updateUI() {
    if (state.unit === 'px') {
        els.btnPx.classList.add('active');
        els.btnRem.classList.remove('active');
        els.labelUnitMin.textContent = '(px)';
        els.labelUnitMax.textContent = '(px)';
    } else {
        els.btnPx.classList.remove('active');
        els.btnRem.classList.add('active');
        els.labelUnitMin.textContent = '(rem)';
        els.labelUnitMax.textContent = '(rem)';
    }
}

/**
 * Utility to round numbers to 4 decimal places.
 */
function round(num) {
    return Math.round(num * 10000) / 10000;
}

/**
 * Main function: Calculates the linear interpolation for clamp().
 * Updates the output code and refreshes the preview iframes.
 */
function calculate() {
    const minW = parseFloat(els.minWidth.value) || 0;
    const maxW = parseFloat(els.maxWidth.value) || 0;
    const minV = parseFloat(els.minVal.value) || 0;
    const maxV = parseFloat(els.maxVal.value) || 0;
    const prop = els.property.value;

    // Validation
    if (minW >= maxW || minW === 0) {
        els.output.textContent = "/* La largeur min doit être inférieure à la max */";
        return;
    }

    // Convert values to pixels for calculation
    let minVPx = minV;
    let maxVPx = maxV;
    if (state.unit === 'rem') {
        minVPx = minV * state.baseRem;
        maxVPx = maxV * state.baseRem;
    }

    // Linear Equation Construction (Y = mx + b)
    const slope = (maxVPx - minVPx) / (maxW - minW);
    const yIntercept = minVPx - (slope * minW);

    let sign = yIntercept >= 0 ? '+' : '-';
    let absIntercept = Math.abs(yIntercept);

    // Formatting Strings according to selected unit
    let interceptStr, minStr, maxStr;

    if (state.unit === 'rem') {
        interceptStr = `${round(absIntercept / state.baseRem)}rem`;
        minStr = `${minV}rem`;
        maxStr = `${maxV}rem`;
    } else {
        interceptStr = `${round(absIntercept)}px`;
        minStr = `${minV}px`;
        maxStr = `${maxV}px`;
    }

    const slopeVw = round(slope * 100);

    // Build clamp() String
    let clampFunc = '';
    if (slope === 0) {
        clampFunc = `${prop}: ${minStr};`;
    } else {
        const valStr = `${interceptStr} ${sign} ${slopeVw}vw`;
        const realMin = minVPx < maxVPx ? minStr : maxStr;
        const realMax = minVPx < maxVPx ? maxStr : minStr;
        clampFunc = `${prop}: clamp(${realMin}, ${valStr}, ${realMax});`;
    }

    els.output.textContent = clampFunc;

    // Update Both Previews

    updatePreviewContent(els.iframeMax, prop, clampFunc);
}

/**
 * Injects styles and content into a specific iframe to visualize the result.
 */
function updatePreviewContent(iframe, prop, cssLine) {
    const doc = iframe.contentDocument;
    if (!doc) return;
    const target = doc.getElementById('targetElement');
    if (!target) return;

    const valueOnly = cssLine.split(':')[1].replace(';', '').trim();

    // Reset styles
    target.className = '';
    target.innerHTML = '';
    target.removeAttribute('style');

    // Apply specific visualization logic
    if (prop === 'font-size') {
        target.className = 'mode-text';
        target.innerHTML = `
            <h1 style="margin:0; font-size: inherit;">Titre Fluide</h1>
            <p style="font-size: 0.5em; margin-top: 10px;">Sous-titre (0.5em)</p>
        `;
        target.style.fontSize = valueOnly;

    } else if (prop === 'width' || prop === 'height') {
        target.className = 'mode-box';
        target.textContent = "Box";
        if (prop === 'width') {
            target.style.height = '150px';
            target.style.width = valueOnly;
        } else {
            target.style.width = '150px';
            target.style.height = valueOnly;
        }

    } else if (prop === 'padding') {
        // Only padding supported now (Margin removed)
        target.className = 'mode-padding';
        target.style.padding = valueOnly;
        target.innerHTML = '<div class="padding-inner">Content</div>';

    } else if (prop === 'gap') {
        target.className = 'mode-gap';
        target.style.gap = valueOnly;
        target.innerHTML = `
            <div class="gap-item">1</div>
            <div class="gap-item">2</div>
            <div class="gap-item">3</div>
            <div class="gap-item">4</div>
        `;
    }
}

/* =========================================
   Observers & Formatters
   ========================================= */

/**
 * Sets up ResizeObserver to display the current width of the preview boxes.
 */
function setupObservers() {
    const ro = new ResizeObserver(entries => {
        for (let entry of entries) {
            const w = Math.round(entry.contentRect.width);
            const h = Math.round(entry.contentRect.height);

            if (entry.target === els.boxMax) els.infoMax.textContent = `Dim: ${w}px x ${h}px`;
        }
    });

    ro.observe(els.boxMax);
}

/**
 * Syncs the preview box widths to the input values on load.
 */
function syncWidths() {
    const minW = els.minWidth.value;
    const maxW = els.maxWidth.value;

    els.boxMax.style.width = maxW + 'px';
}

/**
 * Copies the generated code to clipboard.
 */
function copyCode() {
    const code = els.output.textContent;
    navigator.clipboard.writeText(code).then(() => {
        const btn = document.getElementById('copyBtn');
        btn.textContent = 'Copié !';
        btn.classList.add('copied');
        setTimeout(() => {
            btn.textContent = 'Copier le code';
            btn.classList.remove('copied');
        }, 2000);
    });
}

/* =========================================
   Event Listeners & Initialization
   ========================================= */

[els.minWidth, els.maxWidth, els.minVal, els.maxVal, els.property].forEach(el => {
    el.addEventListener('input', () => {
        calculate();
    });
});

// Update preview box widths when config changes (on blur to avoid jitter)

els.maxWidth.addEventListener('blur', () => els.boxMax.style.width = els.maxWidth.value + 'px');

window.onload = () => {
    initIframes();
    syncWidths();
    setupObservers();
    updateUI();
    setTimeout(calculate, 100);
};
