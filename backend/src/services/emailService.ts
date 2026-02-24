import nodemailer from 'nodemailer';

// --- Lazy Zoho SMTP Transporter ---
// Created on first use to ensure dotenv.config() has already run
let _transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
    if (!_transporter) {
        _transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtppro.zoho.in',
            port: parseInt(process.env.EMAIL_PORT || '465'),
            secure: true, // SSL on port 465
            auth: {
                user: process.env.EMAIL_USER || '',
                pass: process.env.EMAIL_PASS || '',
            },
        });
    }
    return _transporter;
};

const getFrom = () => process.env.EMAIL_FROM || `"The Healthy Canteen" <${process.env.EMAIL_USER || 'contact@thehealthycanteen.in'}>`;

// --- Helpers ---
const sendMail = async (to: string, subject: string, html: string) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('[Email] EMAIL_USER or EMAIL_PASS not configured — skipping email');
        return;
    }
    try {
        await getTransporter().sendMail({ from: getFrom(), to, subject, html });
        console.log(`[Email] Sent "${subject}" to ${to}`);
    } catch (error) {
        console.error(`[Email] Failed to send "${subject}" to ${to}:`, error);
    }
};

const baseStyle = `
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    background: #ffffff;
`;

const headerHtml = `
    <div style="background: #1a1a1a; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <img src="https://thehealthycanteen.in/logo-green-full.png" alt="The Healthy Canteen" style="height: 48px; width: auto;" />
    </div>
`;

const footerHtml = `
    <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            The Healthy Canteen • Fresh, Healthy, Delivered Daily<br/>
            <a href="https://thehealthycanteen.in" style="color: #4ade80; text-decoration: none;">thehealthycanteen.in</a>
        </p>
    </div>
`;

const wrapEmail = (content: string) => `
    <div style="${baseStyle}">
        <div style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
            ${headerHtml}
            <div style="padding: 32px 24px;">
                ${content}
            </div>
            ${footerHtml}
        </div>
    </div>
`;

// ============================================
// EMAIL TEMPLATES
// ============================================

/**
 * 1. ORDER CONFIRMATION — Full bill breakdown
 */
export const sendOrderConfirmation = async (
    userEmail: string,
    userName: string,
    orderDetails: {
        protein: string;
        days: number;
        mealsPerDay: number;
        mealTypes: string[];
        basePlanTotal: number;
        addonTotal: number;
        deliveryFee: number;
        totalPrice: number;
        startDate: string;
        addons?: any;
        addonDefs?: any[];
    }
) => {
    const { protein, days, mealsPerDay, mealTypes, basePlanTotal, addonTotal, deliveryFee, totalPrice, startDate, addons, addonDefs } = orderDetails;

    // Build addon rows
    let addonRows = '';
    if (addons && addonDefs && typeof addons === 'object') {
        for (const [addonId, selection] of Object.entries(addons)) {
            const sel = selection as any;
            if (sel.quantity > 0) {
                const def = addonDefs.find((a: any) => a.id.toString() === addonId);
                if (def) {
                    const lineTotal = sel.frequency === 'daily' ? def.price * sel.quantity * days : def.price * sel.quantity;
                    addonRows += `
                        <tr>
                            <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">${def.name} x${sel.quantity} (${sel.frequency})</td>
                            <td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #f3f4f6;">₹${lineTotal.toLocaleString()}</td>
                        </tr>
                    `;
                }
            }
        }
    }

    // Calculate GST amounts (included in total, just for display)
    const gstRate = 0.025; // 2.5% each
    const cgstAmount = Math.round(totalPrice * gstRate / (1 + gstRate * 2));
    const sgstAmount = cgstAmount;

    const html = wrapEmail(`
        <h2 style="color: #1a1a1a; margin: 0 0 8px;">Order Confirmed! ✅</h2>
        <p style="color: #6b7280; margin: 0 0 24px;">Hi <strong>${userName}</strong>, your meal plan is locked in!</p>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr style="border-bottom: 2px solid #1a1a1a;">
                <td style="padding: 12px 0; font-weight: bold; font-size: 16px;">${protein} Plan</td>
                <td style="padding: 12px 0; text-align: right; font-weight: bold; font-size: 16px;">₹${basePlanTotal.toLocaleString()}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #6b7280;" colspan="2">
                    ${days} Days • ${mealsPerDay} Meal${mealsPerDay > 1 ? 's' : ''}/Day (${mealTypes.join(' & ')})
                </td>
            </tr>

            ${addonRows ? `
                <tr>
                    <td colspan="2" style="padding: 12px 0 4px; font-weight: bold; color: #9ca3af; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Extras</td>
                </tr>
                ${addonRows}
            ` : ''}

            <tr>
                <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #f3f4f6;">Delivery Fee</td>
                <td style="padding: 8px 0; text-align: right; border-bottom: 1px solid #f3f4f6;">₹${deliveryFee}</td>
            </tr>
            <tr>
                <td style="padding: 6px 0; color: #9ca3af; font-size: 13px;">CGST (2.5%)</td>
                <td style="padding: 6px 0; text-align: right; color: #9ca3af; font-size: 13px; font-style: italic;">₹${cgstAmount} (Included)</td>
            </tr>
            <tr>
                <td style="padding: 6px 0; color: #9ca3af; font-size: 13px;">SGST (2.5%)</td>
                <td style="padding: 6px 0; text-align: right; color: #9ca3af; font-size: 13px; font-style: italic;">₹${sgstAmount} (Included)</td>
            </tr>
            <tr style="border-top: 3px solid #1a1a1a;">
                <td style="padding: 16px 0; font-weight: bold; font-size: 20px;">TOTAL</td>
                <td style="padding: 16px 0; text-align: right; font-weight: bold; font-size: 20px; color: #16a34a;">₹${totalPrice.toLocaleString()}</td>
            </tr>
        </table>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <p style="margin: 0; color: #166534; font-size: 14px;">
                📅 <strong>Start Date:</strong> ${new Date(startDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
        </div>

        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 16px;">
            *GST is already included in the total price
        </p>
    `);

    await sendMail(userEmail, 'Order Confirmed! 🥗 — The Healthy Canteen', html);
};

/**
 * 2. SUBSCRIPTION PAUSED
 */
export const sendSubscriptionPaused = async (
    userEmail: string,
    userName: string,
    details: { protein: string; pausesRemaining: number }
) => {
    const html = wrapEmail(`
        <h2 style="color: #1a1a1a; margin: 0 0 8px;">Plan Paused ⏸️</h2>
        <p style="color: #6b7280; margin: 0 0 24px;">Hi <strong>${userName}</strong>, your meal plan has been paused.</p>

        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <p style="font-size: 18px; font-weight: bold; color: #92400e; margin: 0 0 8px;">
                ${details.protein} Plan — Paused
            </p>
            <p style="color: #a16207; margin: 0; font-size: 14px;">
                Pauses remaining: <strong>${details.pausesRemaining}</strong>
            </p>
        </div>

        <p style="color: #6b7280; font-size: 14px;">
            Your end date will be automatically extended by the number of days you stay paused. Resume anytime from your dashboard!
        </p>
    `);

    await sendMail(userEmail, 'Plan Paused ⏸️ — The Healthy Canteen', html);
};

/**
 * 3. SUBSCRIPTION RESUMED
 */
export const sendSubscriptionResumed = async (
    userEmail: string,
    userName: string,
    details: { protein: string; driftDays: number; newEndDate: Date }
) => {
    const html = wrapEmail(`
        <h2 style="color: #1a1a1a; margin: 0 0 8px;">Plan Resumed ▶️</h2>
        <p style="color: #6b7280; margin: 0 0 24px;">Hi <strong>${userName}</strong>, welcome back! Your meal plan is active again.</p>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <p style="font-size: 18px; font-weight: bold; color: #166534; margin: 0 0 8px;">
                ${details.protein} Plan — Active ✅
            </p>
            <p style="color: #15803d; margin: 0; font-size: 14px;">
                Extended by <strong>${details.driftDays} day${details.driftDays !== 1 ? 's' : ''}</strong>
            </p>
            <p style="color: #15803d; margin: 8px 0 0; font-size: 14px;">
                New end date: <strong>${details.newEndDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
            </p>
        </div>

        <p style="color: #6b7280; font-size: 14px;">
            Your deliveries will resume from tomorrow. Eat healthy! 💪
        </p>
    `);

    await sendMail(userEmail, 'Plan Resumed ▶️ — The Healthy Canteen', html);
};

/**
 * 4. SUBSCRIPTION CANCELLED
 */
export const sendSubscriptionCancelled = async (
    userEmail: string,
    userName: string,
    details: { protein: string; reason: string }
) => {
    const html = wrapEmail(`
        <h2 style="color: #1a1a1a; margin: 0 0 8px;">Plan Cancelled</h2>
        <p style="color: #6b7280; margin: 0 0 24px;">Hi <strong>${userName}</strong>, your meal plan has been cancelled.</p>

        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <p style="font-size: 18px; font-weight: bold; color: #991b1b; margin: 0 0 8px;">
                ${details.protein} Plan — Cancelled
            </p>
            <p style="color: #b91c1c; margin: 0; font-size: 14px;">
                Reason: ${details.reason}
            </p>
        </div>

        <p style="color: #6b7280; font-size: 14px;">
            We're sorry to see you go! You can always start a new plan from our website whenever you're ready.
        </p>
        <div style="text-align: center; margin-top: 20px;">
            <a href="https://thehealthycanteen.in/order" style="background: #1a1a1a; color: #4ade80; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                Start a New Plan
            </a>
        </div>
    `);

    await sendMail(userEmail, 'Plan Cancelled — The Healthy Canteen', html);
};

/**
 * 5. DELIVERY CONFIRMED
 */
export const sendDeliveryConfirmation = async (
    userEmail: string,
    userName: string,
    details: { protein: string; mealTypes: string[]; deliveryTime: Date; riderName?: string }
) => {
    const timeStr = details.deliveryTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateStr = details.deliveryTime.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' });

    const html = wrapEmail(`
        <h2 style="color: #1a1a1a; margin: 0 0 8px;">Meal Delivered! 📦</h2>
        <p style="color: #6b7280; margin: 0 0 24px;">Hi <strong>${userName}</strong>, your meal has been delivered.</p>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <p style="font-size: 32px; margin: 0 0 8px;">🍱</p>
            <p style="font-size: 16px; font-weight: bold; color: #166534; margin: 0 0 4px;">
                ${details.protein} — ${details.mealTypes.join(' & ')}
            </p>
            <p style="color: #15803d; margin: 0; font-size: 14px;">
                Delivered at <strong>${timeStr}</strong> on ${dateStr}
            </p>
            ${details.riderName ? `<p style="color: #6b7280; margin: 8px 0 0; font-size: 13px;">Delivered by: ${details.riderName}</p>` : ''}
        </div>

        <p style="color: #6b7280; font-size: 14px; text-align: center;">
            Enjoy your meal! 🥗💪
        </p>
    `);

    await sendMail(userEmail, 'Meal Delivered! 📦 — The Healthy Canteen', html);
};
