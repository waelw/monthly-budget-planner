import { useState, useEffect, useMemo } from "react";
import { format, getDaysInMonth, startOfMonth, addDays } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Check, Calendar, Wallet, PiggyBank } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STORAGE_KEY = "daily-spending-planner";

interface PlannerState {
  totalAmount: string;
  desiredSaving: string;
  selectedMonth: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function generateMonthOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const today = new Date();
  
  for (let i = -2; i <= 12; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
    options.push({
      value: format(date, "yyyy-MM"),
      label: format(date, "MMMM yyyy"),
    });
  }
  
  return options;
}

export default function Home() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  const [state, setState] = useState<PlannerState>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // Invalid JSON, use defaults
        }
      }
    }
    return {
      totalAmount: "",
      desiredSaving: "0",
      selectedMonth: format(new Date(), "yyyy-MM"),
    };
  });

  const monthOptions = useMemo(() => generateMonthOptions(), []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const calculations = useMemo(() => {
    const total = parseFloat(state.totalAmount) || 0;
    const saving = parseFloat(state.desiredSaving) || 0;
    const [year, month] = state.selectedMonth.split("-").map(Number);
    const daysInMonth = getDaysInMonth(new Date(year, month - 1));
    const available = Math.max(0, total - saving);
    const dailyAllowance = daysInMonth > 0 ? available / daysInMonth : 0;

    const days: { date: Date; formattedDate: string; dayName: string; amount: number }[] = [];
    const monthStart = startOfMonth(new Date(year, month - 1));
    
    for (let i = 0; i < daysInMonth; i++) {
      const date = addDays(monthStart, i);
      days.push({
        date,
        formattedDate: format(date, "MMMM d, yyyy"),
        dayName: format(date, "EEEE"),
        amount: dailyAllowance,
      });
    }

    return {
      daysInMonth,
      available,
      dailyAllowance,
      days,
    };
  }, [state.totalAmount, state.desiredSaving, state.selectedMonth]);

  const handleCopy = async () => {
    const lines = calculations.days.map(
      (day) => `${day.dayName}, ${day.formattedDate} → ${formatCurrency(day.amount)}`
    );
    const text = lines.join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Month plan copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Copy failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const hasValidInput = parseFloat(state.totalAmount) > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-8 md:mb-12">
          <h1 
            className="text-2xl md:text-3xl font-bold tracking-tight text-foreground"
            data-testid="text-app-title"
          >
            Daily Spending Planner
          </h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">
            Plan how much you can spend each day of the month
          </p>
        </header>

        <Card className="mb-8">
          <CardContent className="p-6 md:p-8">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label 
                  htmlFor="totalAmount" 
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  Total Amount
                </Label>
                <Input
                  id="totalAmount"
                  type="number"
                  placeholder="e.g., 5000"
                  value={state.totalAmount}
                  onChange={(e) =>
                    setState((prev) => ({ ...prev, totalAmount: e.target.value }))
                  }
                  className="h-12 text-base"
                  data-testid="input-total-amount"
                />
              </div>

              <div className="space-y-2">
                <Label 
                  htmlFor="desiredSaving" 
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <PiggyBank className="h-4 w-4 text-muted-foreground" />
                  Desired Saving
                </Label>
                <Input
                  id="desiredSaving"
                  type="number"
                  placeholder="e.g., 500"
                  value={state.desiredSaving}
                  onChange={(e) =>
                    setState((prev) => ({ ...prev, desiredSaving: e.target.value }))
                  }
                  className="h-12 text-base"
                  data-testid="input-desired-saving"
                />
              </div>

              <div className="space-y-2">
                <Label 
                  htmlFor="month" 
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Month
                </Label>
                <Select
                  value={state.selectedMonth}
                  onValueChange={(value) =>
                    setState((prev) => ({ ...prev, selectedMonth: value }))
                  }
                >
                  <SelectTrigger 
                    id="month" 
                    className="h-12 text-base"
                    data-testid="select-month"
                  >
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((option) => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value}
                        data-testid={`option-month-${option.value}`}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {hasValidInput && (
          <>
            <div className="grid gap-4 md:grid-cols-2 mb-8">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Available to Spend
                  </p>
                  <p 
                    className="text-2xl md:text-3xl font-bold tabular-nums text-foreground"
                    data-testid="text-available-amount"
                  >
                    {formatCurrency(calculations.available)}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Daily Allowance
                  </p>
                  <p 
                    className="text-2xl md:text-3xl font-bold tabular-nums text-foreground"
                    data-testid="text-daily-allowance"
                  >
                    {formatCurrency(calculations.dailyAllowance)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                {calculations.daysInMonth} Days
              </h2>
              <Button
                onClick={handleCopy}
                variant="outline"
                className="gap-2"
                data-testid="button-copy-plan"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Month Plan
                  </>
                )}
              </Button>
            </div>

            <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {calculations.days.map((day, index) => (
                <Card 
                  key={index} 
                  className="hover-elevate transition-shadow duration-200"
                  data-testid={`card-day-${index + 1}`}
                >
                  <CardContent className="p-4">
                    <p className="text-lg font-semibold text-foreground">
                      {day.dayName}
                    </p>
                    <p className="text-sm text-muted-foreground mb-3">
                      {day.formattedDate}
                    </p>
                    <p 
                      className="text-2xl font-bold tabular-nums text-foreground"
                      data-testid={`text-amount-day-${index + 1}`}
                    >
                      {formatCurrency(day.amount)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {!hasValidInput && (
          <div 
            className="text-center py-16 text-muted-foreground"
            data-testid="text-empty-state"
          >
            <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Enter your total amount to see your daily spending plan</p>
          </div>
        )}
      </div>
    </div>
  );
}
