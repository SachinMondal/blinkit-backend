const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOtpEmail = async (to, otp) => {
  try {
    const mailOptions = {
      from: `"MyApp Support" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: "Your OTP Code",
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>OTP Verification</h2>
          <p>Your OTP is:</p>
          <h3 style="color: #2e86de;">${otp}</h3>
          <p>This OTP is valid for 30 seconds. Please do not share it with anyone.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    return error;
  }
};

const sendRejectionEmail = async (userEmail, order, reason) => {
  const {
    user,
    orderItems = [],
    totalCartAmount,
    totalCartDiscountAmount,
    totalCartDiscountedPrice,
  } = order;

  const itemsTableRows = orderItems
    .map((item, index) => {
      const {
        quantity,
        subtotalPrice,
        subtotalDiscountedPrice,
        discountAmount,
        productId,
        variantDetails,
      } = item;

      const productName = productId?.name || "Product Name N/A";
      const variantInfo = variantDetails
        ? Object.entries(variantDetails)
            .filter(
              ([key]) => key !== "_id" && key !== "__v" && key !== "productId"
            )
            .map(([key, value]) => `${key}: ${value}`)
            .join(", ")
        : "N/A";

      return `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${index + 1}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${productName}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${variantInfo}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${quantity}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">₹${subtotalPrice}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">₹${subtotalDiscountedPrice}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">₹${discountAmount}</td>
        </tr>
      `;
    })
    .join("");

  const mailOptions = {
    from: `"Your Company Name" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: `Order #${order._id} Rejected`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #e74c3c;">Order Rejection Notice</h2>
        <p>Dear ${user?.name},</p>
        <p>We're sorry to inform you that your order <strong>#${order._id}</strong> has been <strong style="color: #e74c3c;">rejected</strong>.</p>

        <h3 style="color: #c0392b;">Reason for Rejection:</h3>
        <p style="background-color: #f8d7da; padding: 10px; border-left: 5px solid #f5c2c7;">
          ${reason}
        </p>

        <h3 style="margin-top: 30px;">Order Summary</h3>
        <table style="border-collapse: collapse; width: 100%; margin-top: 10px;">
          <thead style="background-color: #f2f2f2;">
            <tr>
              <th style="padding: 8px; border: 1px solid #ddd;">#</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Product</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Variant</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Qty</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Price</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Discounted</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Discount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsTableRows}
          </tbody>
        </table>

        <h3 style="margin-top: 20px;">Total Summary</h3>
        <ul style="list-style-type: none; padding: 0;">
          <li><strong>Total Amount:</strong> ₹${totalCartAmount}</li>
          <li><strong>Total Discount:</strong> ₹${totalCartDiscountAmount}</li>
          <li><strong>Amount Payable:</strong> ₹${totalCartDiscountedPrice}</li>
        </ul>

        <p style="margin-top: 30px;">If you believe this was a mistake or have any questions, please reach out to our support team.</p>
        <p>Thank you for shopping with us.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    return err;
  }
};

const sendAcceptanceEmail = async (userEmail, order) => {
  const {
    user,
    orderItems = [],
    totalCartAmount,
    totalCartDiscountAmount,
    totalCartDiscountedPrice,
  } = order;

  const itemsTableRows = orderItems
    .map((item, index) => {
      const {
        quantity,
        subtotalPrice,
        subtotalDiscountedPrice,
        discountAmount,
        productId,
        variantDetails,
      } = item;

      const productName = productId?.name || "Product Name N/A";
      const variantInfo = variantDetails
        ? Object.entries(variantDetails)
            .filter(
              ([key]) => key !== "_id" && key !== "__v" && key !== "productId"
            )
            .map(([key, value]) => `${key}: ${value}`)
            .join(", ")
        : "N/A";

      return `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${index + 1}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${productName}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${variantInfo}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${quantity}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">₹${subtotalPrice}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">₹${subtotalDiscountedPrice}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">₹${discountAmount}</td>
        </tr>
      `;
    })
    .join("");

  const mailOptions = {
    from: `"GROCESSARY STORE" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: `Order #${order._id} Confirmed!`,
    html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; color: #333;">
  <h2 style="color: #27ae60; text-align: center; border-bottom: 2px solid #27ae60; padding-bottom: 10px;">
    Your Order Has Been Accepted ✅
  </h2>

  <p>Hi <strong>${user?.name}</strong>,</p>

  <p>
    We're excited to let you know that your order
    <strong>#${order._id}</strong> has been
    <span style="color: #27ae60; font-weight: bold;">accepted</span> and is now being processed.
    It will be delivered in <strong>${deliveryTime}</strong>.
  </p>

  <section style="margin-top: 30px;">
    <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 8px; color: #555;">
      Order Summary
    </h3>

    <table
      style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px;"
      aria-label="Order Summary Table"
    >
      <thead>
        <tr style="background-color: #f2f2f2; text-align: left;">
          <th style="padding: 10px; border: 1px solid #ddd;">#</th>
          <th style="padding: 10px; border: 1px solid #ddd;">Product</th>
          <th style="padding: 10px; border: 1px solid #ddd;">Variant</th>
          <th style="padding: 10px; border: 1px solid #ddd;">Qty</th>
          <th style="padding: 10px; border: 1px solid #ddd;">Price (₹)</th>
          <th style="padding: 10px; border: 1px solid #ddd;">Discounted (₹)</th>
          <th style="padding: 10px; border: 1px solid #ddd;">Discount (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${itemsTableRows}
      </tbody>
    </table>
  </section>

  <section style="margin-top: 30px; font-size: 15px;">
    <h3 style="border-bottom: 1px solid #ddd; padding-bottom: 8px; color: #555;">
      Total Summary
    </h3>
    <ul style="list-style: none; padding: 0; margin-top: 10px;">
      <li style="padding: 5px 0;">
        <strong>Total Amount:</strong> ₹${totalCartAmount.toFixed(2)}
      </li>
      <li style="padding: 5px 0;">
        <strong>Total Discount:</strong> ₹${totalCartDiscountAmount.toFixed(2)}
      </li>
      <li style="padding: 5px 0; font-size: 16px; font-weight: bold; color: #27ae60;">
        Amount Payable: ₹${finalPrice.toFixed(2)}
      </li>
    </ul>
  </section>

  <section style="margin-top: 30px; font-size: 14px; color: #555;">
    <p>
      We'll notify you once your order is shipped. If you have any questions,
      feel free to reply to this email or contact our support team.
    </p>
    <p>Thank you for shopping with us!</p>
  </section>
</div>

    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    return err;
  }
};

module.exports = { sendOtpEmail, sendRejectionEmail, sendAcceptanceEmail };
