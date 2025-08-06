# Payment & Invoice System

A modern web application for accepting online payments and generating invoices with QR codes.

## Features

- **Payment Form**: Clean, user-friendly form to collect customer name, amount, email, and description
- **Invoice Generation**: Automatically generates detailed invoices after payment processing
- **QR Code Integration**: Creates QR codes containing invoice data for easy scanning and verification
- **Modern UI**: Responsive design with beautiful gradients and smooth animations
- **Download Functionality**: Download invoices as text files and QR codes as PNG images
- **Real-time Validation**: Form validation with visual feedback
- **Demo Mode**: Safe demonstration environment (no actual payments processed)

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **QR Code Generation**: QRCode.js library
- **Payment Integration**: Stripe.js (ready for integration)
- **Responsive Design**: CSS Grid and Flexbox
- **Modern UI**: CSS animations and transitions

## File Structure

```
/workspace/
├── index.html          # Main HTML file with payment form and invoice display
├── styles.css          # Modern CSS styling with responsive design
├── app.js             # JavaScript functionality for payments and QR generation
└── README.md          # This documentation file
```

## How to Use

1. **Open the Application**
   - Open `index.html` in a web browser
   - The app works offline and requires no server setup

2. **Enter Payment Details**
   - Fill in customer name (required)
   - Enter payment amount in USD (required)
   - Add optional description
   - Provide customer email (required)

3. **Process Payment**
   - Click "Process Payment" button
   - The app simulates payment processing (2-second delay)
   - Payment status and loading spinner are shown

4. **View Generated Invoice**
   - Invoice displays automatically after successful payment
   - QR code is generated containing invoice data
   - All payment details are shown in organized format

5. **Download Options**
   - Download invoice as text file
   - Download QR code as PNG image
   - Start new payment process

## QR Code Data Structure

The generated QR codes contain JSON data with the following structure:

```json
{
  "type": "invoice",
  "invoiceNumber": "INV-1234567890-123",
  "customer": "Customer Name",
  "amount": 100.00,
  "currency": "USD",
  "status": "Paid",
  "date": "12/25/2023",
  "transactionId": "txn_1234567890"
}
```

## Customization

### Payment Integration
To integrate with real payment processors:

1. **Stripe Integration**:
   - Replace `simulatePaymentProcessing()` with actual Stripe API calls
   - Add your Stripe publishable key
   - Implement server-side payment confirmation

2. **Other Payment Processors**:
   - Replace the payment simulation code
   - Update the payment method in invoice generation

### Styling
- Modify `styles.css` to change colors, fonts, and layout
- Update CSS variables for easy theme customization
- Responsive breakpoints can be adjusted for different screen sizes

### QR Code Customization
- Modify QR code data structure in `generateQRCode()`
- Change QR code colors and size
- Add logo or custom styling to QR codes

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Security Considerations

⚠️ **Important**: This is a demo application. For production use:

- Implement server-side payment processing
- Add proper authentication and authorization
- Use HTTPS for all payment-related operations
- Validate all inputs on the server side
- Implement proper error handling and logging
- Follow PCI DSS compliance requirements

## Demo Features

- Payment processing is simulated (no real money is charged)
- All data is stored locally in the browser
- No server communication occurs
- Safe for testing and demonstration purposes

## License

This project is open source and available under the MIT License.

## Support

For questions or issues, please review the code comments or create an issue in the repository.
