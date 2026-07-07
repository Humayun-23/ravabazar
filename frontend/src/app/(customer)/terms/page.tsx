export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold tracking-tight mb-8">Terms of Service</h1>
      
      <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-muted-foreground">
        <p className="text-lg">Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-2xl font-semibold text-foreground mt-8">1. Acceptance of Terms</h2>
        <p>
          By accessing and using Ravabazar, you accept and agree to be bound by the terms and provision of this agreement. 
          In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
        </p>

        <h2 className="text-2xl font-semibold text-foreground mt-8">2. Products and Pricing</h2>
        <p>
          All products listed on the website are subject to availability. We reserve the right to limit the quantity of any products we supply, 
          supply only part of an order or to divide up orders. We will inform you if we are unable to fill your order.
          Prices for our products are subject to change without notice. We reserve the right at any time to modify or discontinue the Service (or any part or content thereof) without notice at any time.
        </p>

        <h2 className="text-2xl font-semibold text-foreground mt-8">3. User Accounts</h2>
        <p>
          If you create an account on the website, you are responsible for maintaining the security of your account and you are fully responsible for all activities that occur under the account and any other actions taken in connection with it.
          You must immediately notify us of any unauthorized uses of your account or any other breaches of security.
        </p>

        <h2 className="text-2xl font-semibold text-foreground mt-8">4. Limitation of Liability</h2>
        <p>
          In no event shall Ravabazar, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service.
        </p>
      </div>
    </div>
  );
}
