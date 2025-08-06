// Global variables
let currentInvoice = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    const paymentForm = document.getElementById('paymentForm');
    paymentForm.addEventListener('submit', handlePaymentSubmit);
    
    // Add input formatting
    const amountInput = document.getElementById('amount');
    amountInput.addEventListener('input', formatAmountInput);
}

function formatAmountInput(event) {
    let value = event.target.value;
    if (value && !isNaN(value)) {
        event.target.value = parseFloat(value).toFixed(2);
    }
}

async function handlePaymentSubmit(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const spinner = document.getElementById('spinner');
    
    // Show loading state
    submitBtn.disabled = true;
    btnText.textContent = 'Processing...';
    spinner.classList.remove('hidden');
    
    try {
        // Get form data
        const formData = new FormData(event.target);
        const paymentData = {
            customerName: formData.get('customerName'),
            amount: parseFloat(formData.get('amount')),
            description: formData.get('description') || 'Payment',
            email: formData.get('email'),
            timestamp: new Date().toISOString(),
            invoiceNumber: generateInvoiceNumber()
        };
        
        // Simulate payment processing (in real app, this would call Stripe)
        await simulatePaymentProcessing(paymentData);
        
        // Generate invoice
        await generateInvoice(paymentData);
        
    } catch (error) {
        console.error('Payment processing error:', error);
        alert('Payment processing failed. Please try again.');
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        btnText.textContent = 'Process Payment';
        spinner.classList.add('hidden');
    }
}

function generateInvoiceNumber() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `INV-${timestamp}-${random}`;
}

async function simulatePaymentProcessing(paymentData) {
    // Simulate API call delay
    return new Promise(resolve => {
        setTimeout(() => {
            console.log('Payment processed successfully:', paymentData);
            resolve();
        }, 2000);
    });
}

async function generateInvoice(paymentData) {
    currentInvoice = {
        ...paymentData,
        status: 'Paid',
        paymentMethod: 'Demo Payment',
        transactionId: `txn_${Date.now()}`
    };
    
    // Hide payment form and show invoice
    document.getElementById('paymentSection').classList.add('hidden');
    document.getElementById('invoiceSection').classList.remove('hidden');
    
    // Populate invoice details
    displayInvoiceDetails(currentInvoice);
    
    // Generate QR code
    await generateQRCode(currentInvoice);
}

function displayInvoiceDetails(invoice) {
    const invoiceDetails = document.getElementById('invoiceDetails');
    
    const invoiceHTML = `
        <div class="invoice-row">
            <span class="invoice-label">Invoice Number:</span>
            <span class="invoice-value">${invoice.invoiceNumber}</span>
        </div>
        <div class="invoice-row">
            <span class="invoice-label">Customer Name:</span>
            <span class="invoice-value">${invoice.customerName}</span>
        </div>
        <div class="invoice-row">
            <span class="invoice-label">Email:</span>
            <span class="invoice-value">${invoice.email}</span>
        </div>
        <div class="invoice-row">
            <span class="invoice-label">Description:</span>
            <span class="invoice-value">${invoice.description}</span>
        </div>
        <div class="invoice-row">
            <span class="invoice-label">Date:</span>
            <span class="invoice-value">${new Date(invoice.timestamp).toLocaleDateString()}</span>
        </div>
        <div class="invoice-row">
            <span class="invoice-label">Transaction ID:</span>
            <span class="invoice-value">${invoice.transactionId}</span>
        </div>
        <div class="invoice-row">
            <span class="invoice-label">Status:</span>
            <span class="invoice-value">${invoice.status}</span>
        </div>
        <div class="invoice-row">
            <span class="invoice-label">Total Amount:</span>
            <span class="invoice-value">$${invoice.amount.toFixed(2)}</span>
        </div>
    `;
    
    invoiceDetails.innerHTML = invoiceHTML;
}

async function generateQRCode(invoice) {
    const canvas = document.getElementById('qrcode');
    
    // Create QR code data
    const qrData = {
        type: 'invoice',
        invoiceNumber: invoice.invoiceNumber,
        customer: invoice.customerName,
        amount: invoice.amount,
        currency: 'USD',
        status: invoice.status,
        date: new Date(invoice.timestamp).toLocaleDateString(),
        transactionId: invoice.transactionId
    };
    
    const qrText = JSON.stringify(qrData);
    
    try {
        await QRCode.toCanvas(canvas, qrText, {
            width: 200,
            height: 200,
            colorDark: '#333333',
            colorLight: '#ffffff',
            margin: 2,
            errorCorrectionLevel: 'M'
        });
    } catch (error) {
        console.error('QR code generation error:', error);
        canvas.getContext('2d').fillText('QR Code Error', 10, 50);
    }
}

function downloadInvoice() {
    if (!currentInvoice) {
        alert('No invoice to download');
        return;
    }
    
    // Create a temporary link to download invoice as text
    const invoiceText = generateInvoiceText(currentInvoice);
    const blob = new Blob([invoiceText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `invoice_${currentInvoice.invoiceNumber}.txt`;
    
    document.body.appendChild(a);
    a.click();
    
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    // Also download QR code
    downloadQRCode();
}

function generateInvoiceText(invoice) {
    return `
INVOICE
===========================================

Invoice Number: ${invoice.invoiceNumber}
Date: ${new Date(invoice.timestamp).toLocaleDateString()}
Transaction ID: ${invoice.transactionId}

BILL TO:
${invoice.customerName}
${invoice.email}

DESCRIPTION:
${invoice.description}

AMOUNT: $${invoice.amount.toFixed(2)}
STATUS: ${invoice.status}
PAYMENT METHOD: ${invoice.paymentMethod}

===========================================
Thank you for your payment!

This invoice was generated automatically.
For questions, please contact support.
    `;
}

function downloadQRCode() {
    const canvas = document.getElementById('qrcode');
    const link = document.createElement('a');
    link.download = `qr_code_${currentInvoice.invoiceNumber}.png`;
    link.href = canvas.toDataURL();
    link.click();
}

function newPayment() {
    // Reset form
    document.getElementById('paymentForm').reset();
    
    // Show payment section, hide invoice section
    document.getElementById('paymentSection').classList.remove('hidden');
    document.getElementById('invoiceSection').classList.add('hidden');
    
    // Clear current invoice
    currentInvoice = null;
    
    // Focus on first input
    document.getElementById('customerName').focus();
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Add real-time validation
document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('input[required]');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.type === 'email') {
                if (!validateEmail(this.value)) {
                    this.style.borderColor = '#dc3545';
                } else {
                    this.style.borderColor = '#28a745';
                }
            } else if (this.value.trim() === '') {
                this.style.borderColor = '#dc3545';
            } else {
                this.style.borderColor = '#28a745';
            }
        });
    });
});