import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PoliciesPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-quirky-cream p-4 md:p-8 pt-24 pb-12 font-body text-slate-800">
            {/* Back Button */}
            <button
                onClick={() => navigate('/')}
                className="fixed top-6 left-6 z-40 bg-white border-3 border-black p-2 md:p-3 rounded-full shadow-hard hover:scale-110 transition-transform"
            >
                <ArrowLeft size={24} />
            </button>

            <div className="max-w-4xl mx-auto bg-white border-4 border-black rounded-3xl p-8 md:p-12 shadow-hard-xl">
                <h1 className="font-heading text-4xl md:text-5xl text-center mb-12 uppercase decoration-wavy underline decoration-quirky-pink decoration-4 underline-offset-8">
                    Policies & Terms
                </h1>

                <div className="space-y-12">

                    {/* 1. Hold Policy */}
                    <section>
                        <h2 className="font-heading text-2xl md:text-3xl mb-4 flex items-center gap-3">
                            <span className="bg-quirky-yellow border-2 border-black w-8 h-8 flex items-center justify-center rounded-lg text-lg">1</span>
                            Hold Policy (Subscription Pause)
                        </h2>
                        <div className="pl-0 md:pl-11 space-y-3">
                            <p>We understand that schedules change. You may put your subscription on hold under the following conditions:</p>
                            <ul className="list-disc pl-5 space-y-2 marker:text-quirky-pink">
                                <li><strong>Notice Period:</strong> Hold requests must be submitted via the app/website by <strong>4:00 PM</strong> the day prior to the intended hold date.</li>
                                <li><strong>Duration:</strong> Subscriptions can be paused for a minimum of 1 day and a maximum of 6 consecutive days.</li>
                                <li><strong>Subscription Extension:</strong> Any days placed on hold will be added to the end of your current subscription period. Your plan’s validity will be extended accordingly.</li>
                                <li><strong>Limit:</strong> A maximum of 6 hold requests are permitted per 24-day subscription cycle.</li>
                            </ul>
                        </div>
                    </section>

                    {/* 2. Cancellation & Refund Policy */}
                    <section>
                        <h2 className="font-heading text-2xl md:text-3xl mb-4 flex items-center gap-3">
                            <span className="bg-quirky-green border-2 border-black w-8 h-8 flex items-center justify-center rounded-lg text-lg">2</span>
                            Cancellation & Refund Policy
                        </h2>
                        <div className="pl-0 md:pl-11 space-y-3">
                            <ul className="list-disc pl-5 space-y-2 marker:text-quirky-green">
                                <li><strong>Subscription Cancellation:</strong> You may cancel your monthly subscription within the first 3 days of service. A pro-rata refund will be issued for the remaining meals, minus a 10% administrative and processing fee.</li>
                                <li><strong>Daily Meal Cancellation:</strong> Once the 4:00 PM cutoff for the following day has passed, the meal is committed to production. No refunds or "credits" will be provided for cancellations made after this time.</li>
                                <li><strong>Non-Delivery:</strong> If a delivery is unsuccessful due to incorrect address details or the recipient being unreachable, the meal will be returned to the kitchen and considered "delivered." No refunds will be issued for missed deliveries.</li>
                            </ul>
                        </div>
                    </section>

                    {/* 3. Shipping & Delivery Policy */}
                    <section>
                        <h2 className="font-heading text-2xl md:text-3xl mb-4 flex items-center gap-3">
                            <span className="bg-quirky-blue border-2 border-black w-8 h-8 flex items-center justify-center rounded-lg text-white text-lg">3</span>
                            Shipping & Delivery Policy
                        </h2>
                        <div className="pl-0 md:pl-11 space-y-3">
                            <ul className="list-disc pl-5 space-y-2 marker:text-quirky-blue">
                                <li><strong>Service Areas:</strong> We currently deliver to select parts of Pimpri-Chinchwad, Pune. Please verify your pin code at checkout. More delivery zones are being added regularly.</li>
                                <li><strong>Delivery Slots:</strong>
                                    <ul className="list-circle pl-5 mt-1 space-y-1">
                                        <li>Lunch: Delivered between 11:30 AM and 1:30 PM.</li>
                                        <li>Dinner: Delivered between 5:30 PM and 7:30 PM.</li>
                                    </ul>
                                </li>
                                <li><strong>Packaging:</strong> All meals are delivered in eco-friendly, food-grade disposable containers. While we strive for punctuality, delivery times may vary by ±15 minutes due to traffic or weather conditions.</li>
                                <li><strong>Tracking:</strong> You will receive a notification once your meal has left our cloud kitchen.</li>
                            </ul>
                        </div>
                    </section>

                    {/* 4. Privacy Policy */}
                    <section>
                        <h2 className="font-heading text-2xl md:text-3xl mb-4 flex items-center gap-3">
                            <span className="bg-quirky-pink border-2 border-black w-8 h-8 flex items-center justify-center rounded-lg text-white text-lg">4</span>
                            Privacy Policy
                        </h2>
                        <div className="pl-0 md:pl-11 space-y-3">
                            <ul className="list-disc pl-5 space-y-2 marker:text-quirky-pink">
                                <li><strong>Data Collection:</strong> We collect personal information (name, address, contact number) and health-related data (allergies, dietary preferences, fitness goals) to personalize your meal plan.</li>
                                <li><strong>Data Usage:</strong> Your data is used exclusively for order fulfillment, delivery logistics, and service updates. We do not sell or share your personal information with third-party marketing agencies.</li>
                                <li><strong>Security:</strong> All payment transactions are processed through secure, encrypted gateways (Razorpay/Cashfree). We do not store your credit card or banking credentials on our servers.</li>
                            </ul>
                        </div>
                    </section>

                    {/* 5. Terms and Conditions */}
                    <section>
                        <h2 className="font-heading text-2xl md:text-3xl mb-4 flex items-center gap-3">
                            <span className="bg-slate-800 border-2 border-black w-8 h-8 flex items-center justify-center rounded-lg text-white text-lg">5</span>
                            Terms and Conditions
                        </h2>
                        <div className="pl-0 md:pl-11 space-y-3">
                            <ul className="list-disc pl-5 space-y-2 marker:text-slate-800">
                                <li><strong>Health Disclaimer:</strong> The Healthy Canteen provides nutritional meals but is not a medical provider. If you have severe food allergies or chronic medical conditions, please consult a physician before subscribing. We cannot guarantee 100% allergen-free environments in our cloud kitchen.</li>
                                <li><strong>Subscription Validity:</strong> All monthly plans must be utilized within 40 days of the start date (including holds). Unused meals beyond this period will expire.</li>
                                <li><strong>Modification:</strong> The Healthy Canteen reserves the right to modify menus, pricing, or delivery zones with a 7-day notice to active subscribers.</li>
                                <li><strong>Jurisdiction:</strong> These terms are governed by the laws of India, and any disputes shall be subject to the exclusive jurisdiction of the courts in Pimpri-Chinchwad/Pune.</li>
                            </ul>
                        </div>
                    </section>

                </div>

                <div className="mt-16 pt-8 border-t-4 border-gray-100 text-center">
                    <h3 className="font-heading text-xl mb-4">Contact Us</h3>
                    <p className="font-bold text-lg mb-2">contact@thehealthycanteen.in</p>
                    <p className="text-gray-600">B-22 Privia Business Center, Moshi, 411070, Pune, Maharashtra.</p>
                    <p className="text-gray-600 mt-2">Timings: 10:00 AM to 8:00 PM (Mon-Sat)</p>
                </div>

            </div>
        </div>
    );
};
