export default function RefundPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold tracking-tight mb-8">Refund Policy</h1>
      
      <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-muted-foreground">
        <p className="text-lg">Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-2xl font-semibold text-foreground mt-8">1. Returns</h2>
        <p>
          We want you to be completely satisfied with your purchase. If you are not entirely happy with your order, 
          you have 7 days from the date of delivery to request a return. To be eligible for a return, your item must 
          be unused, in the same condition that you received it, and in its original packaging.
        </p>

        <h2 className="text-2xl font-semibold text-foreground mt-8">2. Non-returnable Items</h2>
        <p>
          Certain types of items cannot be returned, including:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Perishable goods (e.g., food, flowers, or plants).</li>
          <li>Custom products (e.g., special orders or personalized items).</li>
          <li>Personal care goods (e.g., beauty products).</li>
          <li>Gift cards or downloadable software products.</li>
        </ul>

        <h2 className="text-2xl font-semibold text-foreground mt-8">3. Refunds</h2>
        <p>
          Once your return is received and inspected, we will send you an email to notify you that we have received 
          your returned item. We will also notify you of the approval or rejection of your refund. If you are approved, 
          then your refund will be processed, and a credit will automatically be applied to your credit card or original 
          method of payment, usually within 5-10 business days.
        </p>

        <h2 className="text-2xl font-semibold text-foreground mt-8">4. Late or Missing Refunds</h2>
        <p>
          If you haven't received a refund yet, first check your bank account again. Then contact your credit card company; 
          it may take some time before your refund is officially posted. Next, contact your bank. There is often some 
          processing time before a refund is posted. If you've done all of this and you still have not received your refund, 
          please contact us.
        </p>

        <h2 className="text-2xl font-semibold text-foreground mt-8">5. Shipping Costs for Returns</h2>
        <p>
          You will be responsible for paying for your own shipping costs for returning your item. Shipping costs are 
          non-refundable. If you receive a refund, the cost of return shipping will be deducted from your refund.
        </p>
      </div>
    </div>
  );
}
