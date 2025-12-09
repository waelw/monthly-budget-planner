import { useState, useEffect, useMemo } from "react";
import { format, eachDayOfInterval, differenceInDays, parseISO, isValid, startOfMonth, endOfMonth, isToday, isPast, isBefore } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Check, Calendar, Wallet, PiggyBank, TrendingDown, TrendingUp, Plus, X, Target, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STORAGE_KEY = "daily-spending-planner";

const SAVINGS_CATEGORIES = [
  { value: "emergency", label: "Emergency Fund" },
  { value: "vacation", label: "Vacation" },
  { value: "retirement", label: "Retirement" },
  { value: "education", label: "Education" },
  { value: "home", label: "Home/Rent" },
  { value: "car", label: "Car/Transport" },
  { value: "health", label: "Health" },
  { value: "investment", label: "Investment" },
  { value: "gift", label: "Gifts" },
  { value: "other", label: "Other" },
];

interface SavingsGoal {
  id: string;
  name: string;
  amount: string;
  category: string;
}

interface PlannerState {
  totalAmount: string;
  startDate: string;
  endDate: string;
  expenses: Record<string, string>;
  savingsGoals: SavingsGoal[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getDefaultDates() {
  const today = new Date();
  const start = startOfMonth(today);
  const end = endOfMonth(today);
  return {
    startDate: format(start, "yyyy-MM-dd"),
    endDate: format(end, "yyyy-MM-dd"),
  };
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export default function Home() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  const [state, setState] = useState<PlannerState>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const defaults = getDefaultDates();
          const migratedGoals = (parsed.savingsGoals || []).map((goal: SavingsGoal) => ({
            ...goal,
            category: goal.category || "other",
          }));
          return {
            totalAmount: parsed.totalAmount || "",
            startDate: parsed.startDate || defaults.startDate,
            endDate: parsed.endDate || defaults.endDate,
            expenses: parsed.expenses || {},
            savingsGoals: migratedGoals.length > 0 ? migratedGoals : [{ id: generateId(), name: "General Savings", amount: "0", category: "other" }],
          };
        } catch {
          // Invalid JSON, use defaults
        }
      }
    }
    const defaults = getDefaultDates();
    return {
      totalAmount: "",
      startDate: defaults.startDate,
      endDate: defaults.endDate,
      expenses: {},
      savingsGoals: [{ id: generateId(), name: "General Savings", amount: "0", category: "other" }],
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const totalSavings = useMemo(() => {
    return state.savingsGoals.reduce((sum, goal) => sum + (parseFloat(goal.amount) || 0), 0);
  }, [state.savingsGoals]);

  const savingsByCategory = useMemo(() => {
    const grouped: Record<string, number> = {};
    state.savingsGoals.forEach((goal) => {
      const amount = parseFloat(goal.amount) || 0;
      if (amount > 0) {
        grouped[goal.category] = (grouped[goal.category] || 0) + amount;
      }
    });
    return grouped;
  }, [state.savingsGoals]);

  const calculations = useMemo(() => {
    const total = parseFloat(state.totalAmount) || 0;
    const available = Math.max(0, total - totalSavings);
    
    const startDate = parseISO(state.startDate);
    const endDate = parseISO(state.endDate);
    
    if (!isValid(startDate) || !isValid(endDate) || startDate > endDate) {
      return {
        daysCount: 0,
        available,
        dailyAllowance: 0,
        days: [],
        isValidRange: false,
        totalSpent: 0,
        totalRemaining: available,
        spentPercentage: 0,
      };
    }
    
    const daysCount = differenceInDays(endDate, startDate) + 1;
    const baseDaily = daysCount > 0 ? available / daysCount : 0;

    const daysArray = eachDayOfInterval({ start: startDate, end: endDate });
    const days: any[] = [];
    let carryover = 0; // Track unspent or overspent amount from previous day

    daysArray.forEach((date, index) => {
      const dateKey = format(date, "yyyy-MM-dd");
      const expenseInput = state.expenses[dateKey];
      const hasInput = expenseInput !== undefined && expenseInput !== "";
      
      // This day's available amount = base daily + any carryover from previous day
      const availableForDay = baseDaily + carryover;
      
      // If no input provided, assume user spent the entire available amount
      const spent = hasInput ? (parseFloat(expenseInput) || 0) : availableForDay;
      const remaining = availableForDay - spent;
      
      // Track unspent or overspent amount for next day (can go negative for overspending)
      carryover = remaining;
      
      days.push({
        date,
        dateKey,
        formattedDate: format(date, "MMMM d, yyyy"),
        dayName: format(date, "EEEE"),
        allowance: availableForDay,
        spent,
        remaining,
      });
    });

    const totalSpent = days.reduce((sum, day) => sum + day.spent, 0);
    const totalRemaining = available - totalSpent;
    const spentPercentage = available > 0 ? Math.min(100, (totalSpent / available) * 100) : 0;

    // Calculate spending up to and including today
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day for comparison
    const spentUpToToday = days.reduce((sum, day) => {
      const dayDate = new Date(day.date);
      dayDate.setHours(0, 0, 0, 0);
      // Include today and past days
      if (isBefore(dayDate, today) || isToday(dayDate)) {
        return sum + day.spent;
      }
      return sum;
    }, 0);

    return {
      daysCount,
      available,
      dailyAllowance: baseDaily,
      days,
      isValidRange: true,
      totalSpent,
      totalRemaining,
      spentPercentage,
      spentUpToToday,
    };
  }, [state.totalAmount, state.startDate, state.endDate, state.expenses, totalSavings]);

  const handleExpenseChange = (dateKey: string, value: string) => {
    setState((prev) => ({
      ...prev,
      expenses: {
        ...prev.expenses,
        [dateKey]: value,
      },
    }));
  };

  const addSavingsGoal = () => {
    setState((prev) => ({
      ...prev,
      savingsGoals: [...prev.savingsGoals, { id: generateId(), name: "", amount: "0", category: "other" }],
    }));
  };

  const updateSavingsGoal = (id: string, field: "name" | "amount" | "category", value: string) => {
    setState((prev) => ({
      ...prev,
      savingsGoals: prev.savingsGoals.map((goal) =>
        goal.id === id ? { ...goal, [field]: value } : goal
      ),
    }));
  };

  const removeSavingsGoal = (id: string) => {
    if (state.savingsGoals.length <= 1) {
      toast({
        title: "Cannot remove",
        description: "You need at least one savings goal",
        variant: "destructive",
      });
      return;
    }
    setState((prev) => ({
      ...prev,
      savingsGoals: prev.savingsGoals.filter((goal) => goal.id !== id),
    }));
  };

  const handleCopy = async () => {
    const lines = calculations.days.map(
      (day) => `${day.dayName}, ${day.formattedDate} → Allowance: ${formatCurrency(day.allowance)}${day.spent > 0 ? `, Spent: ${formatCurrency(day.spent)}, Remaining: ${formatCurrency(day.remaining)}` : ""}`
    );
    const text = lines.join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Spending plan copied to clipboard",
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

  const exportToCSV = () => {
    const headers = ["Date", "Day", "Allowance", "Spent", "Remaining"];
    const rows = calculations.days.map((day) => [
      day.formattedDate,
      day.dayName,
      day.allowance.toFixed(2),
      day.spent.toFixed(2),
      day.remaining.toFixed(2),
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `spending-plan-${state.startDate}-to-${state.endDate}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    toast({
      title: "Exported!",
      description: "CSV file downloaded",
    });
  };

  const hasValidInput = parseFloat(state.totalAmount) > 0 && calculations.isValidRange;

  const getCategoryLabel = (value: string) => {
    return SAVINGS_CATEGORIES.find((c) => c.value === value)?.label || value;
  };

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
            Plan and track your daily spending
          </p>
        </header>

        <Card className="mb-6">
          <CardContent className="p-6 md:p-8">
            <div className="grid gap-6 md:grid-cols-2 mb-6">
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
                <Label className="text-sm font-medium flex items-center gap-2">
                  <PiggyBank className="h-4 w-4 text-muted-foreground" />
                  Total Savings: {formatCurrency(totalSavings)}
                </Label>
                <div className="h-12 flex items-center text-sm text-muted-foreground">
                  From {state.savingsGoals.length} goal{state.savingsGoals.length !== 1 ? "s" : ""} below
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label 
                  htmlFor="startDate" 
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={state.startDate}
                  onChange={(e) =>
                    setState((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                  className="h-12 text-base"
                  data-testid="input-start-date"
                />
              </div>

              <div className="space-y-2">
                <Label 
                  htmlFor="endDate" 
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={state.endDate}
                  onChange={(e) =>
                    setState((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                  className="h-12 text-base"
                  data-testid="input-end-date"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-muted-foreground" />
                Savings Goals
              </CardTitle>
              <Button
                onClick={addSavingsGoal}
                variant="outline"
                size="sm"
                className="gap-2"
                data-testid="button-add-goal"
              >
                <Plus className="h-4 w-4" />
                Add Goal
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {state.savingsGoals.map((goal, index) => (
                <div 
                  key={goal.id} 
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3"
                  data-testid={`savings-goal-${index + 1}`}
                >
                  <Select
                    value={goal.category}
                    onValueChange={(value) => updateSavingsGoal(goal.id, "category", value)}
                  >
                    <SelectTrigger 
                      className="w-full sm:w-40"
                      data-testid={`select-goal-category-${index + 1}`}
                    >
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {SAVINGS_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="text"
                    placeholder="Goal name"
                    value={goal.name}
                    onChange={(e) => updateSavingsGoal(goal.id, "name", e.target.value)}
                    className="flex-1"
                    data-testid={`input-goal-name-${index + 1}`}
                  />
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={goal.amount}
                    onChange={(e) => updateSavingsGoal(goal.id, "amount", e.target.value)}
                    className="w-full sm:w-32"
                    data-testid={`input-goal-amount-${index + 1}`}
                  />
                  <Button
                    onClick={() => removeSavingsGoal(goal.id)}
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    data-testid={`button-remove-goal-${index + 1}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            {Object.keys(savingsByCategory).length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground mb-3">Savings by Category</p>
                <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
                  {Object.entries(savingsByCategory).map(([category, amount]) => (
                    <div 
                      key={category} 
                      className="p-2 rounded-lg bg-muted/50 text-sm"
                      data-testid={`category-summary-${category}`}
                    >
                      <p className="text-xs text-muted-foreground">{getCategoryLabel(category)}</p>
                      <p className="font-semibold tabular-nums">{formatCurrency(amount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {hasValidInput && (
          <>
            <div className="grid gap-4 md:grid-cols-2 mb-6">
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

            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Spending Progress</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{formatCurrency(calculations.totalSpent)}</span>
                    {" / "}
                    {formatCurrency(calculations.available)}
                  </div>
                </div>
                <Progress 
                  value={calculations.spentPercentage} 
                  className="h-3 mb-4"
                  data-testid="progress-spending"
                />
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <TrendingDown className="h-5 w-5 text-destructive" />
                    <div>
                      <p className="text-xs text-muted-foreground">Total Spent</p>
                      <p className="font-semibold tabular-nums" data-testid="text-total-spent">
                        {formatCurrency(calculations.totalSpent)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Spent Up To Today</p>
                      <p className="font-semibold tabular-nums text-primary" data-testid="text-spent-up-to-today">
                        {formatCurrency(calculations.spentUpToToday)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <TrendingUp className={`h-5 w-5 ${calculations.totalRemaining >= 0 ? 'text-green-600' : 'text-destructive'}`} />
                    <div>
                      <p className="text-xs text-muted-foreground">Remaining Budget</p>
                      <p 
                        className={`font-semibold tabular-nums ${calculations.totalRemaining < 0 ? 'text-destructive' : ''}`}
                        data-testid="text-total-remaining"
                      >
                        {formatCurrency(calculations.totalRemaining)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                {calculations.daysCount} Days
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  onClick={exportToCSV}
                  variant="outline"
                  className="gap-2"
                  data-testid="button-export-csv"
                >
                  <FileDown className="h-4 w-4" />
                  Export CSV
                </Button>
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
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {calculations.days.map((day, index) => {
                const isCurrentDay = isToday(day.date);
                return (
                <Card 
                  key={day.dateKey} 
                  className={`transition-shadow duration-200 ${
                    isCurrentDay 
                      ? 'border-primary border-2 shadow-lg ring-2 ring-primary/20 bg-primary/5' 
                      : day.remaining < 0 
                        ? 'border-destructive/50' 
                        : ''
                  }`}
                  data-testid={`card-day-${index + 1}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-lg font-semibold text-foreground">
                        {day.dayName}
                      </p>
                      {isCurrentDay && (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary text-primary-foreground">
                          Today
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {day.formattedDate}
                    </p>
                    <p 
                      className="text-xl font-bold tabular-nums text-foreground mb-3"
                      data-testid={`text-allowance-day-${index + 1}`}
                    >
                      {formatCurrency(day.allowance)}
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="Spent"
                          value={state.expenses[day.dateKey] || ""}
                          onChange={(e) => handleExpenseChange(day.dateKey, e.target.value)}
                          className="h-9 text-sm"
                          data-testid={`input-expense-day-${index + 1}`}
                        />
                      </div>
                      {day.spent > 0 && (
                        <div className={`text-sm font-medium tabular-nums ${day.remaining >= 0 ? 'text-green-600 dark:text-green-500' : 'text-destructive'}`}>
                          {day.remaining >= 0 ? '+' : ''}{formatCurrency(day.remaining)} remaining
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
              })}
            </div>
          </>
        )}

        {!hasValidInput && (
          <div 
            className="text-center py-16 text-muted-foreground"
            data-testid="text-empty-state"
          >
            <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">
              {!calculations.isValidRange && state.startDate && state.endDate
                ? "Please select a valid date range (end date must be after start date)"
                : "Enter your total amount and date range to see your daily spending plan"
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
