import React, { useState } from 'react';
import { QuirkyButton } from './QuirkyButton';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { auth } from '../src/services/api';

import { GoogleLogin, useGoogleOneTapLogin } from '@react-oauth/google';

interface AuthPageProps {
    onLoginSuccess: (user: any) => void;
    onBack: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess, onBack }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [form, setForm] = useState({ email: '', password: '', name: '', phone: '' });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleGoogleSuccess = async (credentialResponse: any) => {
        try {
            setLoading(true);
            const res = await auth.googleLogin(credentialResponse.credential);
            const { token, user } = res.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            onLoginSuccess(user);
        } catch (err) {
            console.error(err);
            setError('Google Login Failed');
        } finally {
            setLoading(false);
        }
    };

    useGoogleOneTapLogin({
        onSuccess: handleGoogleSuccess,
        onError: () => console.log('Google One Tap Failed'),
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            let response;
            if (isLogin) {
                response = await auth.login({ email: form.email, password: form.password });
            } else {
                response = await auth.register(form);
            }

            const { token, user } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            onLoginSuccess(user);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // The funky doodle pattern from the main CSS
    const doodlePattern = `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cstyle%3E.d%7Bfill:none;stroke:%23000;stroke-opacity:0.2;stroke-width:2;stroke-linecap:round;stroke-linejoin:round%7D%3C/style%3E%3Cpath class='d' d='M20,20 Q30,5 40,20 T60,20' /%3E%3Ccircle class='d' cx='80' cy='80' r='8' /%3E%3Cpath class='d' d='M10,80 Q20,70 30,80 T50,80' /%3E%3Cpath class='d' d='M70,20 L80,30 M80,20 L70,30' /%3E%3Cpath class='d' d='M40,50 A10,10 0 0,1 60,50' /%3E%3C/svg%3E")`;

    return (
        <div
            className="min-h-screen bg-quirky-cream flex items-center justify-center p-4 relative overflow-hidden"
            style={{
                backgroundImage: doodlePattern,
                backgroundSize: '100px 100px'
            }}
        >
            {/* Decor Blobs (kept for extra funk) */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-quirky-green rounded-full blur-[100px] opacity-40 animate-float"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-quirky-pink rounded-full blur-[100px] opacity-40 animate-float" style={{ animationDelay: '1s' }}></div>

            <button onClick={onBack} className="absolute top-6 left-6 bg-white border-3 border-black p-3 rounded-full shadow-hard hover:scale-110 transition-transform z-20">
                <ArrowLeft size={24} />
            </button>

            <div className="max-w-md w-full bg-white border-4 border-black rounded-3xl p-8 shadow-hard-xl relative z-10 transform rotate-1 transition-transform hover:rotate-0">

                {/* Sparkle Icon Decor */}
                <div className="absolute -top-6 -right-6 text-quirky-yellow animate-spin-slow hidden md:block">
                    <Sparkles size={60} fill="currentColor" stroke="black" strokeWidth={1} />
                </div>

                <div className="text-center mb-8">
                    <div className="inline-block bg-quirky-yellow border-2 border-black px-4 py-1 rounded-full font-heading text-sm mb-4 shadow-hard-sm">
                        {isLogin ? 'WELCOME BACK' : 'JOIN THE CLUB'}
                    </div>
                    <h2 className="font-heading text-4xl">{isLogin ? 'LOGIN' : 'SIGN UP'}</h2>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border-2 border-red-500 rounded-xl text-red-700 font-bold text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <>
                            <div>
                                <label className="font-heading text-xs uppercase ml-1 mb-1 block">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border-3 border-black p-3 rounded-xl font-heading text-sm focus:bg-blue-50 focus:outline-none focus:shadow-hard transition-all"
                                    placeholder="THE ROCK"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="font-heading text-xs uppercase ml-1 mb-1 block">Phone</label>
                                <input
                                    type="tel"
                                    required
                                    className="w-full border-3 border-black p-3 rounded-xl font-heading text-sm focus:bg-green-50 focus:outline-none focus:shadow-hard transition-all"
                                    placeholder="98765..."
                                    value={form.phone}
                                    onChange={e => setForm({ ...form, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="font-heading text-xs uppercase ml-1 mb-1 block">Address</label>
                                <textarea
                                    required
                                    className="w-full border-3 border-black p-3 rounded-xl font-heading text-sm focus:bg-orange-50 focus:outline-none focus:shadow-hard transition-all resize-none"
                                    placeholder="Flat No, Building, Area..."
                                    rows={2}
                                    value={(form as any).address || ''}
                                    onChange={e => setForm({ ...form, address: e.target.value } as any)}
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <label className="font-heading text-xs uppercase ml-1 mb-1 block">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full border-3 border-black p-3 rounded-xl font-heading text-sm focus:bg-yellow-50 focus:outline-none focus:shadow-hard transition-all"
                            placeholder="you@email.com"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="font-heading text-xs uppercase ml-1 mb-1 block">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full border-3 border-black p-3 rounded-xl font-heading text-sm focus:bg-pink-50 focus:outline-none focus:shadow-hard transition-all"
                            placeholder="********"
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                        />
                    </div>

                    <div className="pt-4">
                        <QuirkyButton type="submit" disabled={loading} className="w-full text-lg py-4 hover:scale-[1.02]">
                            {loading ? 'PROCESSING...' : (isLogin ? 'ENTER CANTEEN' : 'START EATING')}
                        </QuirkyButton>
                    </div>

                    <div className="flex flex-col items-center gap-2 mt-4">
                        <div className="w-full h-px bg-gray-300 my-2"></div>
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => console.log('Login Failed')}
                            useOneTap
                        />
                    </div>
                </form>

                <div className="mt-6 text-center border-t-2 border-dashed border-gray-300 pt-6">
                    <button
                        type="button"
                        onClick={() => { setIsLogin(!isLogin); setError(null); }}
                        className="font-heading text-sm hover:text-quirky-pink underline decoration-wavy"
                    >
                        {isLogin ? "DON'T HAVE AN ACCOUNT? SIGN UP" : "ALREADY A MEMBER? LOGIN"}
                    </button>
                </div>
            </div >
        </div >
    );
};