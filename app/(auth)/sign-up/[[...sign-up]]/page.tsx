"use client"
// pages/sign-up.tsx
import { useState, FormEvent } from 'react';
import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignUp() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [pendingVerification, setPendingVerification] = useState<boolean>(false);
  const [code, setCode] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Start the sign up process
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!isLoaded) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Start the sign up process with Clerk
      await signUp.create({
        emailAddress: email,
        password,
      });

      // Send the verification email
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      
      // Change the UI to show the verification form
      setPendingVerification(true);
      setLoading(false);
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  // Verify the email with the code the user provides
  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!isLoaded) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Attempt to verify the email
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });
      
      if (completeSignUp.status !== 'complete') {
        // The verification may require more steps
        console.log(JSON.stringify(completeSignUp, null, 2));
        setError('Verification failed. Please try again.');
        setLoading(false);
        return;
      }
      
      // Sign up is complete, set the session active
      await setActive({ session: completeSignUp.createdSessionId });
      
      // Redirect to the dashboard or homepage
      router.push('/home');
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      setError('Verification failed. Please try again.');
      setLoading(false);
    }
  };

  // Handle Google OAuth
  const handleGoogleSignUp = async () => {
    if (!isLoaded) {
      return;
    }

    try {
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/home',
        redirectUrlComplete: '/home',
      });
    } catch (err: unknown) {
      console.error(JSON.stringify(err, null, 2));
      setError('Google sign up failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl font-bold text-center">
            {pendingVerification ? 'Verify your email' : 'Create your account'}
          </h2>
          
          {error && (
            <div className="alert alert-error shadow-lg mt-4">
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}
          
          {!pendingVerification ? (
            <>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Email</span>
                  </label>
                  <input
                    type="email"
                    className="input input-bordered w-full"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Password</span>
                  </label>
                  <input
                    type="password"
                    className="input input-bordered w-full"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-control mt-6">
                  <button
                    type="submit"
                    className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
                    disabled={loading}
                  >
                    {loading ? 'Signing up...' : 'Sign up with Email'}
                  </button>
                </div>
              </form>
              
              <div className="divider">OR</div>
              
              <button
                onClick={handleGoogleSignUp}
                className="btn btn-outline w-full"
                disabled={loading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 mr-2">
                  <path
                    fill="currentColor"
                    d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 1C8.703 1 5.415 3.097 3.705 6.163a9.97 9.97 0 000 9.675c1.71 3.065 5 5.162 8.84 5.162 4.716 0 8.714-3.12 9.979-7.361a9.79 9.79 0 00.266-2.264c0-.67-.054-1.32-.158-1.95h-10.87z"
                  />
                </svg>
                Continue with Google
              </button>
              
              <div className="text-center mt-4">
                <p>
                  Already have an account?{' '}
                  <Link href="/sign-in" className="text-primary hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4 mt-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Verification Code</span>
                </label>
                <p className="text-sm text-gray-500 mb-2">
                  A verification code has been sent to {email}. Please enter it below.
                </p>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-control mt-6">
                <button
                  type="submit"
                  className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
                  disabled={loading}
                >
                  {loading ? 'Verifying...' : 'Verify Email'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}