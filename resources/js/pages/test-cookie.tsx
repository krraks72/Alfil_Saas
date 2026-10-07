import { useEffect } from 'react';

export default function TestCookie() {
    useEffect(() => {
        // Clear any existing cookie consent
        localStorage.removeItem('cookie-consent');
    }, []);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Cookie Test Page</h1>
            <p>Check the browser console for debug information.</p>
            <p>The cookie popup should appear if enableLogging is true.</p>
            <button 
                onClick={() => {
                    localStorage.removeItem('cookie-consent');
                    window.location.reload();
                }}
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
            >
                Clear Cookie Consent & Reload
            </button>
        </div>
    );
}