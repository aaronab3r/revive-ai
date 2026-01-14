'use client';

import { useState, useRef } from 'react';
import { updateSettings } from '@/app/actions/settings';
import { provisionSystem } from '@/app/actions/provision';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Copy, Check, Sparkles, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface SettingsFormProps {
  initialSettings: any;
  serviceAccountEmail: string;
}

export function SettingsForm({ initialSettings, serviceAccountEmail }: SettingsFormProps) {
  const [loading, setLoading] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [provisionedData, setProvisionedData] = useState<{ assistantId?: string; phoneNumberId?: string } | null>(null);
  
  const formRef = useRef<HTMLFormElement>(null);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(serviceAccountEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  async function handleProvision() {
    const keyInput = document.getElementById('quick_setup_key') as HTMLInputElement;
    const vapiKey = keyInput?.value?.trim();

    // Get business details from the form
    const businessNameInput = document.getElementById('business_name') as HTMLInputElement;
    const businessIndustryInput = document.getElementById('business_industry') as HTMLSelectElement;
    const agentNameInput = document.getElementById('agent_name') as HTMLInputElement;
    const agentRoleInput = document.getElementById('agent_role') as HTMLInputElement;

    const businessName = businessNameInput?.value?.trim();
    const businessIndustry = businessIndustryInput?.value || 'General';
    const agentName = agentNameInput?.value?.trim() || 'Sarah';
    const agentRole = agentRoleInput?.value?.trim() || 'Assistant';

    if (!vapiKey) {
      setMessage({ type: 'error', text: 'Please enter your Vapi Private Key first.' });
      return;
    }

    if (!businessName) {
      setMessage({ type: 'error', text: 'Please enter your Business Name in the section above.' });
      return;
    }

    setProvisioning(true);
    setMessage(null);

    try {
      const result = await provisionSystem({
        vapiPrivateKey: vapiKey,
        businessName,
        businessIndustry,
        agentName,
        agentRole,
      });

      if (result.success && result.data) {
        setMessage({ type: 'success', text: result.message });
        setProvisionedData(result.data);
        
        // Auto-fill the form fields
        if (formRef.current) {
          const privateKeyInput = formRef.current.querySelector('[name="vapi_private_key"]') as HTMLInputElement;
          const assistantInput = formRef.current.querySelector('[name="vapi_assistant_id"]') as HTMLInputElement;
          const phoneInput = formRef.current.querySelector('[name="vapi_phone_number_id"]') as HTMLInputElement;
          
          if (privateKeyInput) privateKeyInput.value = vapiKey;
          if (assistantInput) assistantInput.value = result.data.assistantId;
          if (phoneInput) phoneInput.value = result.data.phoneNumberId;
        }
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred. Please try again.' });
    } finally {
      setProvisioning(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const formEl = event.currentTarget;
    
    // Sync ALL fields from the quick setup sections (Step 1, 2, 3) to the form
    
    // Step 1: Business Details
    const businessNameVisible = document.getElementById('business_name') as HTMLInputElement;
    const businessIndustryVisible = document.getElementById('business_industry') as HTMLInputElement;
    const agentNameVisible = document.getElementById('agent_name') as HTMLInputElement;
    const agentRoleVisible = document.getElementById('agent_role') as HTMLInputElement;

    const businessNameHidden = formEl.querySelector('input[name="business_name"]') as HTMLInputElement;
    const businessIndustryHidden = formEl.querySelector('input[name="business_industry"]') as HTMLInputElement;
    const agentNameHidden = formEl.querySelector('input[name="agent_name"]') as HTMLInputElement;
    const agentRoleHidden = formEl.querySelector('input[name="agent_role"]') as HTMLInputElement;

    if (businessNameHidden && businessNameVisible) businessNameHidden.value = businessNameVisible.value;
    if (businessIndustryHidden && businessIndustryVisible) businessIndustryHidden.value = businessIndustryVisible.value;
    if (agentNameHidden && agentNameVisible) agentNameHidden.value = agentNameVisible.value;
    if (agentRoleHidden && agentRoleVisible) agentRoleHidden.value = agentRoleVisible.value;

    // Step 2: Quick Setup Key -> Sync to visible vapi_private_key field
    const quickSetupKey = document.getElementById('quick_setup_key') as HTMLInputElement;
    const vapiPrivateKeyField = formEl.querySelector('input[name="vapi_private_key"]') as HTMLInputElement;
    if (vapiPrivateKeyField && quickSetupKey && quickSetupKey.value) {
      vapiPrivateKeyField.value = quickSetupKey.value;
    }

    // Step 3: Calendar Email -> Sync to hidden calendar_email field
    const quickCalendarEmail = document.getElementById('quick_calendar_email') as HTMLInputElement;
    const calendarEmailHidden = formEl.querySelector('input[name="calendar_email"]') as HTMLInputElement;
    if (calendarEmailHidden && quickCalendarEmail && quickCalendarEmail.value) {
      calendarEmailHidden.value = quickCalendarEmail.value;
    }

    const formData = new FormData(formEl);
    
    // Debug: Log what we're sending
    console.log('📝 Saving settings:', {
      business_name: formData.get('business_name'),
      business_industry: formData.get('business_industry'),
      agent_name: formData.get('agent_name'),
      agent_role: formData.get('agent_role'),
      vapi_private_key: formData.get('vapi_private_key') ? '***set***' : '***empty***',
      vapi_assistant_id: formData.get('vapi_assistant_id'),
      vapi_phone_number_id: formData.get('vapi_phone_number_id'),
      calendar_email: formData.get('calendar_email'),
    });

    const result = await updateSettings(formData);

    setLoading(false);
    if (result.success) {
      setMessage({ type: 'success', text: result.message });
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  }

  // Default values from prop or empty string
  const defaults = initialSettings || {};

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Configuration</CardTitle>
        <CardDescription>
          Manage your API keys and service integrations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* ============================================== */}
        {/* BUSINESS DETAILS - Required for AI personality */}
        {/* ============================================== */}
        <div className="mb-8 p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-amber-600 rounded-lg">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Your Business Details</h3>
            <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">Step 1</span>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Tell us about your business so your AI agent can represent you perfectly.
          </p>

          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="business_name" className="text-sm font-medium">Business Name *</Label>
                <Input 
                  id="business_name"
                  name="business_name" 
                  type="text" 
                  placeholder="e.g., Acme Solutions, Peak Realty"
                  className="bg-white"
                  defaultValue={defaults.business_name || ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_industry" className="text-sm font-medium">Industry</Label>
                <select 
                  id="business_industry"
                  name="business_industry"
                  className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  defaultValue={defaults.business_industry || 'General'}
                >
                  <option value="General">General</option>
                  <option value="Dental">Dental</option>
                  <option value="Medical">Medical</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Home Services">Home Services</option>
                  <option value="Legal">Legal</option>
                  <option value="Fitness">Fitness</option>
                  <option value="Salon/Spa">Salon/Spa</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agent_name" className="text-sm font-medium">AI Agent Name</Label>
                <Input 
                  id="agent_name"
                  name="agent_name" 
                  type="text" 
                  placeholder="Sarah"
                  className="bg-white"
                  defaultValue={defaults.agent_name || 'Sarah'}
                />
                <p className="text-xs text-slate-500">The name your AI will use when speaking.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agent_role" className="text-sm font-medium">AI Agent Role</Label>
                <Input 
                  id="agent_role"
                  name="agent_role" 
                  type="text" 
                  placeholder="Scheduling Assistant"
                  className="bg-white"
                  defaultValue={defaults.agent_role || 'Assistant'}
                />
                <p className="text-xs text-slate-500">e.g., Scheduling Assistant, Client Liaison</p>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================== */}
        {/* QUICK SETUP - One Click Configuration */}
        {/* ============================================== */}
        <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-blue-600 rounded-lg">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Quick Setup</h3>
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">Step 2</span>
          </div>
          
          {/* Setup Guide */}
          <div className="mb-5 p-4 bg-white/70 rounded-lg border border-blue-100 space-y-3">
            <p className="text-sm font-medium text-slate-700">Before clicking the button below, complete these steps on <a href="https://vapi.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">vapi.ai</a>:</p>
            
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">1</span>
                <div>
                  <p className="text-sm font-medium text-slate-800">Get your API Private Key</p>
                  <p className="text-xs text-slate-500">Create an account → Click <strong>&quot;API Keys&quot;</strong> in the sidebar → Copy the Private Key</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">2</span>
                <div>
                  <p className="text-sm font-medium text-slate-800">Create a Phone Number</p>
                  <p className="text-xs text-slate-500">Click <strong>&quot;Phone Numbers&quot;</strong> → Enter any area code → Create the number → <em>Wait 2 minutes for activation</em></p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-600 mb-4">
            Paste your Vapi Private Key and we&apos;ll automatically create your AI agent, configure the voice, and link it to your phone number.
          </p>
          
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="quick_setup_key" className="text-sm font-medium">Vapi Private Key</Label>
              <Input 
                id="quick_setup_key"
                type="password" 
                autoComplete="off"
                placeholder="Paste your key from dashboard.vapi.ai"
                className="bg-white"
                onChange={(e) => {
                  const privateKeyInput = document.getElementById('vapi_private_key') as HTMLInputElement;
                  if (privateKeyInput) privateKeyInput.value = e.target.value;
                }}
              />
            </div>
            
            <Button 
              type="button" 
              onClick={handleProvision}
              disabled={provisioning}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
            >
              {provisioning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Building your AI Agent...
                </>
              ) : provisionedData ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  AI Created Successfully!
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Auto-Configure My AI
                </>
              )}
            </Button>
          </div>
        </div>

        {/* ============================================== */}
        {/* CALENDAR CONFIGURATION - Step 3 */}
        {/* ============================================== */}
        <div className="mb-8 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-green-600 rounded-lg">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Calendar Configuration</h3>
            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">Step 3</span>
          </div>
          
          <div className="mb-4 p-3 bg-green-100/50 border border-green-200 rounded-lg flex gap-3 items-start">
            <AlertCircle className="h-5 w-5 text-green-700 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-green-800">
              <span className="font-semibold">Required for all users:</span> You must complete this section even if you plan to enter your Vapi keys manually below.
            </p>
          </div>

          <p className="text-sm text-slate-600 mb-4">
            Connect your Google Calendar so the AI can book appointments for you.
          </p>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quick_calendar_email" className="text-sm font-medium">Your Google Calendar Email</Label>
              <Input 
                id="quick_calendar_email"
                type="email" 
                autoComplete="off"
                placeholder="doctor@clinic.com"
                className="bg-white"
                defaultValue={defaults.calendar_email || ''}
                onChange={(e) => {
                  const items = document.querySelectorAll('[name="calendar_email"]');
                  items.forEach((item) => (item as HTMLInputElement).value = e.target.value);
                }}
              />
              <p className="text-xs text-slate-500">
                The email address of the Google Calendar where you want appointments to be made.
              </p>
            </div>

            {/* Service Account Copy Box */}
            <div className="p-4 bg-white/70 rounded-lg border border-green-200 space-y-3">
               <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">System Bot Email (Share your Calendar with this email)</Label>
                  <p className="text-xs text-slate-500">
                     Go to your Google Calendar Settings {'>'} "Share with specific people" {'>'} Add this email with "Make changes to events" permission.
                  </p>
               </div>
               <div className="flex items-center gap-2">
                  <Input 
                     readOnly 
                     value={serviceAccountEmail} 
                     className="bg-white font-mono text-xs"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={copyToClipboard}
                  >
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
               </div>
            </div>
            
            <Button 
              type="button" 
              onClick={() => formRef.current?.requestSubmit()}
              disabled={loading} 
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Configuration
            </Button>
          </div>
        </div>
        
        {/* Success Message for Provisioning or Saving */}
        {message && (
             <div className={`mb-8 p-4 rounded-xl flex items-center gap-3 border ${
               message.type === 'success' 
                 ? 'bg-green-50 border-green-200 text-green-700' 
                 : 'bg-red-50 border-red-200 text-red-700'
             }`}>
               {message.type === 'success' ? (
                 <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
               ) : (
                 <AlertCircle className="h-5 w-5 flex-shrink-0" />
               )}
               <p className="text-sm font-medium">{message.text}</p>
             </div>
        )}

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-400">Or configure manually</span>
          </div>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-8" autoComplete="off">
          
          {/* Hidden fields to sync business details from the top section */}
          <input type="hidden" name="business_name" id="form_business_name" defaultValue={defaults.business_name || ''} />
          <input type="hidden" name="business_industry" id="form_business_industry" defaultValue={defaults.business_industry || 'General'} />
          <input type="hidden" name="agent_name" id="form_agent_name" defaultValue={defaults.agent_name || 'Sarah'} />
          <input type="hidden" name="agent_role" id="form_agent_role" defaultValue={defaults.agent_role || 'Assistant'} />

          {/* VAPI Configuration */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Vapi Configuration</h3>
            
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="vapi_private_key">Vapi Private Key</Label>
                <Input 
                  id="vapi_private_key"
                  name="vapi_private_key" 
                  type="password" 
                  autoComplete="new-password"
                  defaultValue={defaults.vapi_private_key || ''} 
                />
                <p className="text-xs text-muted-foreground">Used for server-side API calls.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vapi_public_key">Vapi Public Key</Label>
                <Input 
                  id="vapi_public_key"
                  name="vapi_public_key" 
                  type="password" 
                  autoComplete="new-password"
                  defaultValue={defaults.vapi_public_key || ''} 
                />
                <p className="text-xs text-muted-foreground">Used for client-side interactions (if needed).</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vapi_assistant_id">Vapi Assistant ID</Label>
                  <Input 
                    id="vapi_assistant_id"
                    name="vapi_assistant_id" 
                    type="text" 
                    defaultValue={defaults.vapi_assistant_id || ''} 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vapi_phone_number_id">Vapi Phone Number ID</Label>
                  <Input 
                    id="vapi_phone_number_id"
                    name="vapi_phone_number_id" 
                    type="text" 
                    defaultValue={defaults.vapi_phone_number_id || ''} 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100" />
          
          {/* Calendar Email - Hidden/Synced for form submission */}
          <input 
            type="hidden" 
            name="calendar_email" 
            id="calendar_email"
            defaultValue={defaults.calendar_email || ''} 
          />

          {message && (
            <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Configuration
          </Button>

        </form>
      </CardContent>
    </Card>
  );
}
