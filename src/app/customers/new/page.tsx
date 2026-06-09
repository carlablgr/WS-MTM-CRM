import CustomerForm from "@/components/CustomerForm";

export default function NewCustomerPage() {
  return (
    <div>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-green-muted mb-1">Customers</p>
        <h1 className="text-3xl font-medium text-green">New Customer</h1>
      </div>
      <CustomerForm />
    </div>
  );
}
