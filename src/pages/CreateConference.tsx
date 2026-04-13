import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload } from "lucide-react";
import { toast } from "sonner";
import munLogo from "@/assets/mun-ai-logo.png";

function generateCode(len: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < len; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

const CreateConference = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
    location: "",
    email: "",
    paymentLink: "",
    paymentAmount: "",
    paymentDetails: "",
  });

  const update = (key: string, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleCreate = async () => {
    if (!form.name || !form.startDate || !form.endDate) {
      toast.error("Please fill in conference name and dates");
      return;
    }

    setLoading(true);
    try {
      // Sign up / sign in flow — SecGen must be authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in first to create a conference");
        navigate("/auth?redirect=create-conference");
        return;
      }

      const secgenCode = generateCode(8);
      const secretariatCode = generateCode(8);
      const publicCode = generateCode(6);

      const { data, error } = await supabase.from("conferences").insert({
        name: form.name,
        start_date: form.startDate,
        end_date: form.endDate,
        location: form.location,
        email: form.email,
        payment_link: form.paymentLink,
        payment_amount: form.paymentAmount,
        payment_details: form.paymentDetails,
        secgen_code: secgenCode,
        secretariat_code: secretariatCode,
        public_code: publicCode,
        secgen_user_id: session.user.id,
      }).select().single();

      if (error) throw error;

      // Create user_role for secgen
      await supabase.from("user_roles").insert({
        user_id: session.user.id,
        conference_id: (data as any).id,
        role: "secgen",
        display_name: session.user.email,
        approved: true,
      } as any);

      toast.success("Conference created!");
      navigate(`/secgen/${(data as any).id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create conference");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero p-4">
      <div className="max-w-lg mx-auto pt-8 animate-fade-in">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center gap-3 mb-8">
          <img src={munLogo} alt="MUN AI" className="w-10 h-10 object-contain" />
          <h1 className="font-display text-2xl font-bold text-foreground">Create Conference</h1>
        </div>

        <div className="glass-card rounded-2xl p-6 space-y-5">
          <div>
            <Label className="text-sm font-medium">Conference Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Harvard WorldMUN 2025"
              className="rounded-xl mt-1.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Start Date *</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => update("startDate", e.target.value)}
                className="rounded-xl mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">End Date *</Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => update("endDate", e.target.value)}
                className="rounded-xl mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Location</Label>
            <Input
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              placeholder="City, Country"
              className="rounded-xl mt-1.5"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Conference Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="xyzmun@gmail.com"
              className="rounded-xl mt-1.5"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Payment Link</Label>
            <Input
              value={form.paymentLink}
              onChange={(e) => update("paymentLink", e.target.value)}
              placeholder="https://..."
              className="rounded-xl mt-1.5"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">Payment Amount</Label>
            <Input
              value={form.paymentAmount}
              onChange={(e) => update("paymentAmount", e.target.value)}
              placeholder="e.g. $50 USD"
              className="rounded-xl mt-1.5"
            />
          </div>

          <Button
            onClick={handleCreate}
            disabled={loading}
            className="w-full rounded-xl h-12 font-semibold gradient-primary border-0 text-base"
          >
            {loading ? "Creating..." : "Create Conference"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateConference;
