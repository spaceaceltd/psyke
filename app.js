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

    // Tabs
    const tabPayment = document.getElementById('tabPayment');
    const tabChats = document.getElementById('tabChats');
    if (tabPayment && tabChats) {
        tabPayment.addEventListener('click', () => switchTab('payment'));
        tabChats.addEventListener('click', () => switchTab('chats'));
    }

    // Chat events
    const chatInput = document.getElementById('chatInput');
    const sendChatBtn = document.getElementById('sendChatBtn');
    if (chatInput && sendChatBtn) {
        sendChatBtn.addEventListener('click', sendChatMessage);
        chatInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
            }
        });
        chatInput.addEventListener('input', autoResizeTextarea);
    }

    // WebRTC UI events
    const btnHostCreateOffer = document.getElementById('btnHostCreateOffer');
    const btnHostSetAnswer = document.getElementById('btnHostSetAnswer');
    const btnJoinCreateAnswer = document.getElementById('btnJoinCreateAnswer');
    const btnModeStart = document.getElementById('btnModeStart');
    const btnModeJoin = document.getElementById('btnModeJoin');
    const btnWsConnect = document.getElementById('btnWsConnect');
    const btnWsDisconnect = document.getElementById('btnWsDisconnect');
    const btnClearOffer = document.getElementById('btnClearOffer');
    if (btnHostCreateOffer) btnHostCreateOffer.addEventListener('click', webrtcHostCreateOffer);
    if (btnHostSetAnswer) btnHostSetAnswer.addEventListener('click', webrtcHostSetAnswer);
    if (btnJoinCreateAnswer) btnJoinCreateAnswer.addEventListener('click', webrtcJoinCreateAnswer);
    if (btnModeStart) btnModeStart.addEventListener('click', () => switchWebrtcMode('start'));
    if (btnModeJoin) btnModeJoin.addEventListener('click', () => switchWebrtcMode('join'));
    if (btnWsConnect) btnWsConnect.addEventListener('click', connectSignaling);
    if (btnWsDisconnect) btnWsDisconnect.addEventListener('click', disconnectSignaling);
    if (btnClearOffer) btnClearOffer.addEventListener('click', webrtcHostCreateOffer);
}

// Removed fractal background animation functions

function switchTab(tab) {
    const tabPayment = document.getElementById('tabPayment');
    const tabChats = document.getElementById('tabChats');
    const paymentSection = document.getElementById('paymentSection');
    const invoiceSection = document.getElementById('invoiceSection');
    const chatSection = document.getElementById('chatSection');

    if (tab === 'payment') {
        tabPayment.classList.add('active');
        tabPayment.setAttribute('aria-selected', 'true');
        tabChats.classList.remove('active');
        tabChats.setAttribute('aria-selected', 'false');
        paymentSection.classList.remove('hidden');
        // Only hide invoice if it's not currently showing an invoice flow
        // Keep existing logic: invoice remains controlled by payment flow
        chatSection.classList.add('hidden');
    } else if (tab === 'chats') {
        tabChats.classList.add('active');
        tabChats.setAttribute('aria-selected', 'true');
        tabPayment.classList.remove('active');
        tabPayment.setAttribute('aria-selected', 'false');
        paymentSection.classList.add('hidden');
        invoiceSection.classList.add('hidden');
        chatSection.classList.remove('hidden');
    }

    // Wallet buttons
    const btnGPay = document.getElementById('btnGPay');
    const btnApplePay = document.getElementById('btnApplePay');
    const btnAmazonPay = document.getElementById('btnAmazonPay');
    if (btnGPay) btnGPay.addEventListener('click', () => handleWalletPay('Google Pay'));
    if (btnApplePay) btnApplePay.addEventListener('click', () => handleWalletPay('Apple Pay'));
    if (btnAmazonPay) btnAmazonPay.addEventListener('click', () => handleWalletPay('Amazon Pay'));
}

// In-memory chat state (non-storage)
const chatMessages = [];
let webrtcPeer = null;
let webrtcChannel = null;
let isWebrtcConnected = false;
let ws = null;
let wsRoom = '';

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const text = (input.value || '').trim();
    if (!text) return;

    // Send over WebRTC if available
    if (webrtcChannel && webrtcChannel.readyState === 'open') {
        webrtcChannel.send(JSON.stringify({ type: 'chat', text }));
        chatMessages.push({ author: 'Me', text, timestamp: Date.now() });
        renderChatMessages();
        input.value = '';
        return;
    }

    // Local only fallback
    chatMessages.push({ author: 'Me', text, timestamp: Date.now() });
    renderChatMessages();
    input.value = '';
}

function renderChatMessages() {
    const list = document.getElementById('chatMessages');
    if (!list) return;
    list.innerHTML = chatMessages.map(m => (
        `<div class="chat-message"><span class="author">${m.author}:</span><span class="text">${escapeHtml(m.text)}</span></div>`
    )).join('');
    list.scrollTop = list.scrollHeight;
}

function autoResizeTextarea(e) {
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 180) + 'px';
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#039;');
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

async function handleWalletPay(method) {
    const form = document.getElementById('paymentForm');
    const formData = new FormData(form);
    const paymentData = {
        customerName: formData.get('customerName') || 'Guest',
        amount: parseFloat(formData.get('amount') || '0'),
        description: formData.get('description') || `${method} Payment`,
        email: formData.get('email') || 'guest@example.com',
        timestamp: new Date().toISOString(),
        invoiceNumber: generateInvoiceNumber(),
        paymentMethod: method
    };

    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const spinner = document.getElementById('spinner');
    submitBtn.disabled = true;
    btnText.textContent = `Processing ${method}...`;
    spinner.classList.remove('hidden');

    try {
        await simulatePaymentProcessing(paymentData);
        await generateInvoice(paymentData);
    } catch (e) {
        console.error('Wallet payment error:', e);
        alert(`${method} failed. Please try again.`);
    } finally {
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
        paymentMethod: paymentData.paymentMethod || 'Demo Payment',
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
    const img = document.getElementById('qrcodeImg');
    
    // Ensure correct visibility defaults (prefer canvas first)
    if (img) img.classList.add('hidden');
    if (canvas) canvas.classList.remove('hidden');
    
    // Ensure QRCode library is loaded
    await waitForQRCodeLib();
    const QR = getQRCodeAPI();
    if (!QR) {
        try {
            if (canvas) {
                const ctx = canvas.getContext('2d');
                canvas.width = 220;
                canvas.height = 220;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.font = '16px sans-serif';
                ctx.fillStyle = '#333333';
                ctx.fillText('QR lib missing', 40, 110);
            }
        } catch (_) {}
        return;
    }

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
    
    // Clear previous canvas content
    try {
        if (canvas) {
            const ctx = canvas.getContext('2d');
            // Ensure canvas has sensible size before drawing
            canvas.width = 220;
            canvas.height = 220;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    } catch (_) {}
    
    // Preferred: render to canvas
    try {
        if (!canvas) throw new Error('QR canvas not found');
        await QR.toCanvas(canvas, qrText, {
            width: 200,
            margin: 2,
            errorCorrectionLevel: 'M',
            color: { dark: '#333333', light: '#ffffff' }
        });
        return;
    } catch (error) {
        console.error('QR code canvas render failed:', error);
    }
    
    // Fallback: data URL -> <img>
    try {
        const dataUrl = await QR.toDataURL(qrText, {
            width: 200,
            margin: 2,
            errorCorrectionLevel: 'M',
            color: { dark: '#333333', light: '#ffffff' }
        });
        if (img) {
            img.src = dataUrl;
            img.classList.remove('hidden');
        }
        if (canvas) canvas.classList.add('hidden');
        return;
    } catch (fallbackError) {
        console.error('QR code data URL fallback failed:', fallbackError);
    }
    
    // Last resort: show error text
    try {
        const ctx = canvas.getContext('2d');
        canvas.width = 220;
        canvas.height = 220;
        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#333333';
        ctx.fillText('QR Code Error', 10, 110);
        if (img) img.classList.add('hidden');
        if (canvas) canvas.classList.remove('hidden');
    } catch (_) {}
}

async function waitForQRCodeLib() {
    if (window.QRCode) return;
    const start = Date.now();
    while (!window.QRCode && Date.now() - start < 2000) {
        await new Promise(r => setTimeout(r, 50));
    }
}

function getQRCodeAPI() {
    if (window.QRCode) return window.QRCode;
    try {
        // Fallback if global variable exists without window property
        // eslint-disable-next-line no-undef
        if (typeof QRCode !== 'undefined') return QRCode;
    } catch (_) {}
    return null;
}

function downloadInvoice() {
    if (!currentInvoice) {
        alert('No invoice to download');
        return;
    }

    // Generate a PDF that includes invoice details and the QR code
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: 'pt', format: 'a4' });

        const margin = 40;
        let y = margin;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.text('INVOICE', margin, y);
        y += 30;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        const lines = generateInvoiceText(currentInvoice).split('\n');
        lines.forEach(line => {
            if (line.trim() === 'INVOICE' || line.trim().startsWith('====')) return;
            doc.text(line, margin, y);
            y += 16;
        });

        // Add QR image on the right
        const canvas = document.getElementById('qrcode');
        const img = document.getElementById('qrcodeImg');
        let dataUrl = '';
        try {
            if (img && !img.classList.contains('hidden') && img.src) {
                dataUrl = img.src;
            } else if (canvas && !canvas.classList.contains('hidden')) {
                dataUrl = canvas.toDataURL('image/png');
            }
        } catch (_) {}

        if (dataUrl) {
            const qrSize = 180; // pixels -> points roughly 1:1 at 72dpi
            const pageWidth = doc.internal.pageSize.getWidth();
            doc.addImage(dataUrl, 'PNG', pageWidth - qrSize - margin, margin, qrSize, qrSize);
        }

        doc.save(`invoice_${currentInvoice.invoiceNumber}.pdf`);
    } catch (e) {
        console.error('PDF generation failed, falling back to text + PNG:', e);
        // Fallback: original behavior
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
        downloadQRCode();
    }
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
    const img = document.getElementById('qrcodeImg');
    const link = document.createElement('a');
    link.download = `qr_code_${currentInvoice.invoiceNumber}.png`;
    const isImgVisible = img && !img.classList.contains('hidden') && img.src;
    link.href = isImgVisible ? img.src : canvas.toDataURL();
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
    
    // Clear QR code elements
    try {
        const canvas = document.getElementById('qrcode');
        const img = document.getElementById('qrcodeImg');
        if (img) {
            img.src = '';
            img.classList.add('hidden');
        }
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width || 0, canvas.height || 0);
            canvas.classList.remove('hidden');
        }
    } catch (_) {}
    
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

// -------------------- WebRTC Data Channel (manual signaling) --------------------
function getWebrtcConfig() {
    return {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478?transport=udp' }
        ]
    };
}

function resetWebrtc() {
    try { if (webrtcChannel) webrtcChannel.close(); } catch (_) {}
    try { if (webrtcPeer) webrtcPeer.close(); } catch (_) {}
    webrtcPeer = null;
    webrtcChannel = null;
    isWebrtcConnected = false;
    setWebrtcStatus('Disconnected');
}

function setWebrtcStatus(text) {
    const el = document.getElementById('webrtcStatus');
    if (el) el.textContent = text;
}

async function connectSignaling() {
    if (ws && ws.readyState === WebSocket.OPEN) return;
    const roomInput = document.getElementById('webrtcRoom');
    wsRoom = (roomInput && roomInput.value.trim()) || 'default-room';
    const wssBase = await fetchSignalingBase();
    const url = `${wssBase.replace('http', 'ws')}/ws`;
    try {
        ws = new WebSocket(url);
    } catch (e) {
        alert('WebSocket not supported');
        return;
    }
    ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'join', room: wsRoom }));
        setWebrtcStatus('Signaling Connected');
    };
    ws.onclose = () => {
        setWebrtcStatus('Disconnected');
    };
    ws.onmessage = async (e) => {
        try {
            const msg = JSON.parse(e.data);
            if (msg.type === 'joined') {
                // no-op
            } else if (msg.type === 'offer') {
                await handleRemoteOffer(msg);
            } else if (msg.type === 'answer') {
                await handleRemoteAnswer(msg);
            } else if (msg.type === 'candidate') {
                await handleRemoteCandidate(msg);
            } else if (msg.type === 'peer-left') {
                resetWebrtc();
            }
        } catch (_) {}
    };
}

function disconnectSignaling() {
    try { if (ws) ws.close(); } catch (_) {}
    ws = null;
}

async function fetchSignalingBase() {
    try {
        const res = await fetch('signaling.json', { cache: 'no-store' });
        const data = await res.json();
        return (data.wssBase || '').replace('http://', 'ws://').replace('https://', 'wss://');
    } catch (_) {
        return 'ws://localhost:8765';
    }
}

function switchWebrtcMode(mode) {
    const start = document.getElementById('webrtcStart');
    const join = document.getElementById('webrtcJoin');
    if (!start || !join) return;
    if (mode === 'start') {
        start.classList.remove('hidden');
        join.classList.add('hidden');
    } else {
        join.classList.remove('hidden');
        start.classList.add('hidden');
    }
}

function bindPeerEvents(peer) {
    peer.onconnectionstatechange = () => {
        const state = peer.connectionState;
        setWebrtcStatus(state.charAt(0).toUpperCase() + state.slice(1));
        if (state === 'disconnected' || state === 'failed' || state === 'closed') {
            isWebrtcConnected = false;
        }
    };
    peer.onicecandidate = (e) => {
        if (e.candidate && ws && ws.readyState === WebSocket.OPEN && wsRoom) {
            ws.send(JSON.stringify({ type: 'candidate', room: wsRoom, candidate: e.candidate }));
        }
    };
    peer.oniceconnectionstatechange = () => {
        const s = peer.iceConnectionState;
        if (s === 'connected' || s === 'completed') {
            isWebrtcConnected = true;
            setWebrtcStatus('Connected');
        }
    };
    peer.ondatachannel = (e) => {
        webrtcChannel = e.channel;
        bindChannelEvents(webrtcChannel);
    };
}

function bindChannelEvents(channel) {
    channel.onopen = () => {
        isWebrtcConnected = true;
        setWebrtcStatus('Connected');
    };
    channel.onclose = () => {
        isWebrtcConnected = false;
        setWebrtcStatus('Disconnected');
    };
    channel.onmessage = (e) => {
        try {
            const msg = JSON.parse(e.data);
            if (msg.type === 'chat') {
                chatMessages.push({ author: 'Peer', text: msg.text, timestamp: Date.now() });
                renderChatMessages();
            }
        } catch (_) {}
    };
}

async function webrtcHostCreateOffer() {
    resetWebrtc();
    webrtcPeer = new RTCPeerConnection(getWebrtcConfig());
    bindPeerEvents(webrtcPeer);
    webrtcChannel = webrtcPeer.createDataChannel('chat');
    bindChannelEvents(webrtcChannel);

    const offer = await webrtcPeer.createOffer({ offerToReceiveAudio: false, offerToReceiveVideo: false });
    await webrtcPeer.setLocalDescription(offer);
    await waitForIceGatheringComplete(webrtcPeer);

    const offerOut = document.getElementById('offerOut');
    if (offerOut) offerOut.value = JSON.stringify(webrtcPeer.localDescription);

    // Auto signaling: send offer via WS if connected
    if (ws && ws.readyState === WebSocket.OPEN && wsRoom) {
        ws.send(JSON.stringify({ type: 'offer', room: wsRoom, sdp: webrtcPeer.localDescription }));
    }
}

async function webrtcHostSetAnswer() {
    if (!webrtcPeer) return;
    const answerIn = document.getElementById('answerIn');
    try {
        const desc = JSON.parse(answerIn.value);
        await webrtcPeer.setRemoteDescription(desc);
    } catch (e) {
        alert('Invalid answer JSON');
    }
}

async function webrtcJoinCreateAnswer() {
    resetWebrtc();
    webrtcPeer = new RTCPeerConnection(getWebrtcConfig());
    bindPeerEvents(webrtcPeer);

    const offerIn = document.getElementById('offerIn');
    let remoteOffer;
    try {
        remoteOffer = JSON.parse(offerIn.value);
        await webrtcPeer.setRemoteDescription(remoteOffer);
    } catch (e) {
        alert('Invalid offer JSON');
        return;
    }

    const answer = await webrtcPeer.createAnswer();
    await webrtcPeer.setLocalDescription(answer);
    await waitForIceGatheringComplete(webrtcPeer);

    const answerOut = document.getElementById('answerOut');
    if (answerOut) answerOut.value = JSON.stringify(webrtcPeer.localDescription);

    if (ws && ws.readyState === WebSocket.OPEN && wsRoom) {
        ws.send(JSON.stringify({ type: 'answer', room: wsRoom, sdp: webrtcPeer.localDescription }));
    }
}

function waitForIceGatheringComplete(pc) {
    return new Promise(resolve => {
        if (pc.iceGatheringState === 'complete') {
            resolve();
        } else {
            const check = () => {
                if (pc.iceGatheringState === 'complete') {
                    pc.removeEventListener('icegatheringstatechange', check);
                    resolve();
                }
            };
            pc.addEventListener('icegatheringstatechange', check);
        }
    });
}

async function handleRemoteOffer(msg) {
    resetWebrtc();
    webrtcPeer = new RTCPeerConnection(getWebrtcConfig());
    bindPeerEvents(webrtcPeer);
    try {
        await webrtcPeer.setRemoteDescription(msg.sdp);
        const answer = await webrtcPeer.createAnswer();
        await webrtcPeer.setLocalDescription(answer);
        await waitForIceGatheringComplete(webrtcPeer);
        if (ws && ws.readyState === WebSocket.OPEN && wsRoom) {
            ws.send(JSON.stringify({ type: 'answer', room: wsRoom, sdp: webrtcPeer.localDescription }));
        }
    } catch (e) {
        console.error('Failed handling remote offer', e);
    }
}

async function handleRemoteAnswer(msg) {
    if (!webrtcPeer) return;
    try {
        await webrtcPeer.setRemoteDescription(msg.sdp);
    } catch (e) {
        console.error('Failed applying remote answer', e);
    }
}

async function handleRemoteCandidate(msg) {
    if (!webrtcPeer) return;
    try {
        await webrtcPeer.addIceCandidate(msg.candidate);
    } catch (e) {
        console.error('Failed adding ICE candidate', e);
    }
}