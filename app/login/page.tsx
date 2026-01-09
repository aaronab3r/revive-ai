'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { login } from '../actions/auth';

function SubmitButton() {
  const { pending } = useFormStatus();
 
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
    >
      {pending ? 'Entering...' : 'Enter Dashboard'}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(login, null);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          Revive AI Login
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-700">
          <form action={formAction} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-700 text-white"
                />
              </div>
            </div>

            {state?.message && (
              <div className="text-red-400 text-sm text-center">
                {state.message}
              </div>
            )}

            <div>
              <SubmitButton />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
