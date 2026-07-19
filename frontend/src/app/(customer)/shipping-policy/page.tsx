export default function ShippingPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold tracking-tight mb-8">Shipping Policy</h1>
      
      <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-muted-foreground">
        <p className="text-lg">Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-2xl font-semibold text-foreground mt-8">1. Processing Time</h2>
        <p>
          All orders are processed within 1-2 business days. Orders are not shipped or delivered on weekends or holidays.
          If we are experiencing a high volume of orders, shipments may be delayed by a few days. Please allow additional 
          days in transit for delivery.
        </p>

        <h2 className="text-2xl font-semibold text-foreground mt-8">2. Shipping Rates & Delivery Estimates</h2>
        <p>
          Shipping charges for your order will be calculated and displayed at checkout. Delivery delays can occasionally occur.
          Estimated delivery times:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Standard Shipping:</strong> 3-5 business days</li>
          <li><strong>Express Shipping:</strong> 1-2 business days</li>
        </ul>

        <h2 className="text-2xl font-semibold text-foreground mt-8">3. Shipment Confirmation & Order Tracking</h2>
        <p>
          You will receive a Shipment Confirmation email once your order has shipped containing your tracking number(s). 
          The tracking number will be active within 24 hours.
        </p>

        <h2 className="text-2xl font-semibold text-foreground mt-8">4. Damages</h2>
        <p>
          Ravabazar is not liable for any products damaged or lost during shipping. If you received your order damaged, 
          please contact the shipment carrier to file a claim. Please save all packaging materials and damaged goods 
          before filing a claim.
        </p>

        <h2 className="text-2xl font-semibold text-foreground mt-8">5. International Shipping Policy</h2>
        <p>
          We currently do not ship outside of our primary operating regions. Please check back later as we expand our 
          shipping coverage.
        </p>
      </div>
    </div>
  );
}
