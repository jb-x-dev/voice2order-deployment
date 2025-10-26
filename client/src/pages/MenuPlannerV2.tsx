import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Calendar, ChefHat, Loader2, Plus, Trash2, Copy, Download } from "lucide-react";
import { useCallback, useMemo, useState, useEffect } from "react";
import { Link } from "wouter";

export default function MenuPlannerV2() {
  const { user, loading: authLoading } = useAuth();
  const { data: menuPlans, isLoading: plansLoading, refetch: refetchPlans } = trpc.menuPlans.list.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: recipes } = trpc.recipes.list.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: orderLists, refetch: refetchOrderLists } = trpc.orderLists.list.useQuery(undefined, {
    enabled: !!user,
  });

  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const { data: selectedPlan, refetch: refetchPlan } = trpc.menuPlans.get.useQuery(
    { id: selectedPlanId! },
    { enabled: !!selectedPlanId }
  );

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddMealDialogOpen, setIsAddMealDialogOpen] = useState(false);
  const [isAddRecipeDialogOpen, setIsAddRecipeDialogOpen] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [isGenerateOrderListDialogOpen, setIsGenerateOrderListDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);

  const [newPlanData, setNewPlanData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    description: "",
    status: "entwurf" as any,
    maxBudgetPerDay: 0,
    budgetTolerance: 10,
  });

  const [newMealData, setNewMealData] = useState({
    mealType: "mittagessen" as any,
    recipeId: 0,
    portions: 4,
    notes: "",
  });

  const [newRecipeData, setNewRecipeData] = useState({
    recipeId: 0,
    portions: 4,
    isAlternative: false,
  });

  const [duplicateData, setDuplicateData] = useState({
    newStartDate: "",
    newEndDate: "",
  });

  const [orderListName, setOrderListName] = useState("");

  const createPlanMutation = trpc.menuPlans.create.useMutation();
  const updatePlanMutation = trpc.menuPlans.update.useMutation();
  const deletePlanMutation = trpc.menuPlans.delete.useMutation();
  const duplicatePlanMutation = trpc.menuPlans.duplicate.useMutation();
  const addEntryMutation = trpc.menuPlans.addEntry.useMutation();
  const updateEntryMutation = trpc.menuPlans.updateEntry.useMutation();
  const deleteEntryMutation = trpc.menuPlans.deleteEntry.useMutation();
  const addRecipeToEntryMutation = trpc.menuPlans.addRecipeToEntry.useMutation();
  const updateRecipeInEntryMutation = trpc.menuPlans.updateRecipeInEntry.useMutation();
  const removeRecipeFromEntryMutation = trpc.menuPlans.removeRecipeFromEntry.useMutation();
  const generateOrderListMutation = trpc.orderLists.generateFromMenuPlan.useMutation();

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPlanMutation.mutateAsync({
        name: newPlanData.name,
        startDate: new Date(newPlanData.startDate),
        endDate: new Date(newPlanData.endDate),
        description: newPlanData.description,
        status: newPlanData.status,
        maxBudgetPerDay: newPlanData.maxBudgetPerDay * 100, // Convert to cents
        budgetTolerance: newPlanData.budgetTolerance,
      });
      setIsCreateDialogOpen(false);
      setNewPlanData({ 
        name: "", 
        startDate: "", 
        endDate: "", 
        description: "", 
        status: "entwurf",
        maxBudgetPerDay: 0,
        budgetTolerance: 10,
      });
      refetchPlans();
    } catch (error) {
      console.error("Fehler beim Erstellen:", error);
      alert("Fehler beim Erstellen des Menüplans");
    }
  };

  const handleDeletePlan = async (id: number) => {
    if (!confirm("Möchten Sie diesen Menüplan wirklich löschen?")) return;
    try {
      await deletePlanMutation.mutateAsync({ id });
      if (selectedPlanId === id) setSelectedPlanId(null);
      refetchPlans();
    } catch (error) {
      console.error("Fehler beim Löschen:", error);
      alert("Fehler beim Löschen des Menüplans");
    }
  };

  const handleDuplicatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId) return;
    try {
      const result = await duplicatePlanMutation.mutateAsync({
        id: selectedPlanId,
        newStartDate: new Date(duplicateData.newStartDate),
        newEndDate: new Date(duplicateData.newEndDate),
      });
      setIsDuplicateDialogOpen(false);
      setDuplicateData({ newStartDate: "", newEndDate: "" });
      refetchPlans();
      setSelectedPlanId(result.id);
    } catch (error) {
      console.error("Fehler beim Duplizieren:", error);
      alert("Fehler beim Duplizieren des Menüplans");
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedPlanId) return;
    try {
      await updatePlanMutation.mutateAsync({
        id: selectedPlanId,
        status: status as any,
      });
      refetchPlan();
    } catch (error) {
      console.error("Fehler beim Aktualisieren:", error);
      alert("Fehler beim Aktualisieren des Status");
    }
  };

  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId || !selectedDate) return;

    try {
      await addEntryMutation.mutateAsync({
        menuPlanId: selectedPlanId,
        date: selectedDate,
        mealType: newMealData.mealType,
        recipeId: newMealData.recipeId,
        portions: newMealData.portions,
        notes: newMealData.notes,
      });
      setIsAddMealDialogOpen(false);
      setNewMealData({ mealType: "mittagessen", recipeId: 0, portions: 4, notes: "" });
      refetchPlan();
    } catch (error) {
      console.error("Fehler beim Hinzufügen:", error);
      alert("Fehler beim Hinzufügen der Mahlzeit");
    }
  };

  const handleAddRecipeToMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntryId) return;

    try {
      await addRecipeToEntryMutation.mutateAsync({
        entryId: selectedEntryId,
        recipeId: newRecipeData.recipeId,
        portions: newRecipeData.portions,
        isAlternative: newRecipeData.isAlternative,
      });
      setIsAddRecipeDialogOpen(false);
      setNewRecipeData({ recipeId: 0, portions: 4, isAlternative: false });
      refetchPlan();
    } catch (error) {
      console.error("Fehler beim Hinzufügen:", error);
      alert("Fehler beim Hinzufügen des Rezepts");
    }
  };

  const handleUpdatePortions = async (entryId: number, portions: number) => {
    try {
      await updateEntryMutation.mutateAsync({ id: entryId, portions });
      refetchPlan();
    } catch (error) {
      console.error("Fehler beim Aktualisieren:", error);
    }
  };

  const handleUpdateRecipePortions = async (recipeId: number, portions: number) => {
    try {
      await updateRecipeInEntryMutation.mutateAsync({ id: recipeId, portions });
      refetchPlan();
    } catch (error) {
      console.error("Fehler beim Aktualisieren:", error);
    }
  };

  const handleDeleteEntry = async (entryId: number) => {
    if (!confirm("Möchten Sie diese Mahlzeit wirklich entfernen?")) return;
    try {
      await deleteEntryMutation.mutateAsync({ id: entryId });
      refetchPlan();
    } catch (error) {
      console.error("Fehler beim Löschen:", error);
    }
  };

  const handleRemoveRecipe = async (recipeId: number) => {
    if (!confirm("Möchten Sie dieses Rezept wirklich entfernen?")) return;
    try {
      await removeRecipeFromEntryMutation.mutateAsync({ id: recipeId });
      refetchPlan();
    } catch (error) {
      console.error("Fehler beim Entfernen:", error);
    }
  };

  const handleGenerateOrderList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId) return;
    try {
      await generateOrderListMutation.mutateAsync({
        menuPlanId: selectedPlanId,
        name: orderListName || undefined,
      });
      setIsGenerateOrderListDialogOpen(false);
      setOrderListName("");
      refetchOrderLists();
      alert("Bestellliste erfolgreich erstellt!");
    } catch (error) {
      console.error("Fehler beim Generieren:", error);
      alert("Fehler beim Generieren der Bestellliste");
    }
  };

  const getMealTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      fruehstueck: "Frühstück",
      mittagessen: "Mittagessen",
      abendessen: "Abendessen",
      snack: "Snack",
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      entwurf: "Entwurf",
      vorlage: "Vorlage",
      aktiv: "Aktiv",
      archiviert: "Archiviert",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      entwurf: "bg-gray-100 text-gray-800",
      vorlage: "bg-blue-100 text-blue-800",
      aktiv: "bg-green-100 text-green-800",
      archiviert: "bg-yellow-100 text-yellow-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const planDays = useMemo(() => {
    if (!selectedPlan) return [];
    const start = new Date(selectedPlan.startDate);
    const end = new Date(selectedPlan.endDate);
    const days: Date[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    return days;
  }, [selectedPlan]);

  const getEntriesForDate = (date: Date) => {
    if (!selectedPlan?.entries) return [];
    return selectedPlan.entries.filter(
      (entry) => new Date(entry.date).toDateString() === date.toDateString()
    );
  };

  const calculateTotalCost = useCallback(() => {
    if (!selectedPlan?.entries) return 0;
    return selectedPlan.entries.reduce((total, entry) => {
      const ingredients = entry.recipe?.ingredients || [];
      const recipeCost = ingredients.reduce((sum, ing) => sum + (ing.pricePerUnit || 0), 0);
      let entryTotal = (recipeCost * entry.portions) / (entry.recipe?.defaultPortions || 1);
      
      if (entry.additionalRecipes) {
        entry.additionalRecipes.forEach((ar: any) => {
          if (ar.isSelected) {
            const arIngredients = ar.recipe?.ingredients || [];
            const arCost = arIngredients.reduce((sum: number, ing: any) => sum + (ing.pricePerUnit || 0), 0);
            entryTotal += (arCost * ar.portions) / (ar.recipe?.defaultPortions || 1);
          }
        });
      }
      
      return total + entryTotal;
    }, 0);
  }, [selectedPlan]);

  const calculateBudgetPerDay = useCallback(() => {
    if (!selectedPlan?.entries) return {};
    const budgetByDay: Record<string, number> = {};
    
    selectedPlan.entries.forEach((entry) => {
      const dateKey = new Date(entry.date).toDateString();
      const ingredients = entry.recipe?.ingredients || [];
      const recipeCost = ingredients.reduce((sum, ing) => sum + (ing.pricePerUnit || 0), 0);
      let entryCost = (recipeCost * entry.portions) / (entry.recipe?.defaultPortions || 1);
      
      if (entry.additionalRecipes) {
        entry.additionalRecipes.forEach((ar: any) => {
          if (ar.isSelected) {
            const arIngredients = ar.recipe?.ingredients || [];
            const arCost = arIngredients.reduce((sum: number, ing: any) => sum + (ing.pricePerUnit || 0), 0);
            entryCost += (arCost * ar.portions) / (ar.recipe?.defaultPortions || 1);
          }
        });
      }
      
      budgetByDay[dateKey] = (budgetByDay[dateKey] || 0) + entryCost;
    });
    
    return budgetByDay;
  }, [selectedPlan]);

  if (authLoading || plansLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Anmeldung erforderlich</CardTitle>
            <CardDescription>Bitte melden Sie sich an, um Menüpläne zu erstellen.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const budgetByDay = calculateBudgetPerDay();
  const maxBudget = selectedPlan?.maxBudgetPerDay || 0;
  const tolerance = selectedPlan?.budgetTolerance ? parseFloat(selectedPlan.budgetTolerance as any) : 10;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Menüplaner V2</h1>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedPlanId?.toString() || ""} onValueChange={(val) => setSelectedPlanId(Number(val))}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Menüplan wählen" />
                </SelectTrigger>
                <SelectContent>
                  {menuPlans?.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id.toString()}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Link href="/">
                <Button variant="outline">Startseite</Button>
              </Link>
              <Link href="/recipes">
                <Button variant="outline">Rezepte</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Sidebar - Menüpläne */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Meine Menüpläne</CardTitle>
                  <Button
                    size="sm"
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!menuPlans || menuPlans.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Noch keine Menüpläne vorhanden
                  </p>
                ) : (
                  <div className="space-y-2">
                    {menuPlans.map((plan) => (
                      <div
                        key={plan.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedPlanId === plan.id
                            ? "bg-blue-50 border-blue-300"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedPlanId(plan.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium">{plan.name}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(plan.startDate).toLocaleDateString("de-DE")} -{" "}
                              {new Date(plan.endDate).toLocaleDateString("de-DE")}
                            </div>
                            <Badge className={`mt-2 ${getStatusColor(plan.status || "entwurf")}`}>
                              {getStatusLabel(plan.status || "entwurf")}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePlan(plan.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Menüplan Details */}
          <div className="lg:col-span-3">
            {!selectedPlan ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Wählen Sie einen Menüplan aus oder erstellen Sie einen neuen</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{selectedPlan.name}</CardTitle>
                        <CardDescription>
                          {new Date(selectedPlan.startDate).toLocaleDateString("de-DE")} -{" "}
                          {new Date(selectedPlan.endDate).toLocaleDateString("de-DE")}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Select 
                          value={selectedPlan.status || "entwurf"} 
                          onValueChange={handleUpdateStatus}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="entwurf">Entwurf</SelectItem>
                            <SelectItem value="vorlage">Vorlage</SelectItem>
                            <SelectItem value="aktiv">Aktiv</SelectItem>
                            <SelectItem value="archiviert">Archiviert</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsDuplicateDialogOpen(true)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Duplizieren
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsGenerateOrderListDialogOpen(true)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Bestellliste
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Gesamtkosten</div>
                        <div className="text-2xl font-bold text-blue-600">
                          {(calculateTotalCost() / 100).toFixed(2)} €
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Mahlzeiten</div>
                        <div className="text-2xl font-bold">{selectedPlan.entries?.length || 0}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Max. Budget/Tag</div>
                        <div className="text-2xl font-bold">
                          {maxBudget > 0 ? `${(maxBudget / 100).toFixed(2)} €` : "Nicht festgelegt"}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tage */}
                <div className="space-y-4">
                  {planDays.map((day) => {
                    const entries = getEntriesForDate(day);
                    const dateKey = day.toDateString();
                    const dayCost = budgetByDay[dateKey] || 0;
                    const isOverBudget = maxBudget > 0 && dayCost > maxBudget * (1 + tolerance / 100);
                    
                    return (
                      <Card key={day.toISOString()}>
                        <CardHeader>
                          <div className="flex justify-between items-center">
                            <div>
                              <CardTitle className="text-lg">
                                {day.toLocaleDateString("de-DE", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </CardTitle>
                              {maxBudget > 0 && (
                                <div className={`text-sm mt-1 ${isOverBudget ? "text-red-600 font-semibold" : "text-gray-600"}`}>
                                  Budget: {(dayCost / 100).toFixed(2)} € / {(maxBudget / 100).toFixed(2)} €
                                  {isOverBudget && " (Überschritten!)"}
                                </div>
                              )}
                            </div>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedDate(day);
                                setIsAddMealDialogOpen(true);
                              }}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Mahlzeit
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {entries.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">
                              Noch keine Mahlzeiten geplant
                            </p>
                          ) : (
                            <div className="space-y-4">
                              {entries.map((entry) => (
                                <div key={entry.id} className="border rounded-lg p-4 bg-gray-50">
                                  <div className="flex justify-between items-start mb-3">
                                    <div>
                                      <div className="font-semibold text-gray-700">
                                        {getMealTypeLabel(entry.mealType)}
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteEntry(entry.id)}
                                    >
                                      <Trash2 className="h-4 w-4 text-red-600" />
                                    </Button>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    {/* Main Recipe */}
                                    <div className="flex items-center justify-between p-2 bg-white rounded">
                                      <div className="flex-1">
                                        <div className="font-medium">{entry.recipe?.name}</div>
                                        <div className="text-xs text-gray-500">Hauptrezept</div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Input
                                          type="number"
                                          min="1"
                                          max="500"
                                          value={entry.portions}
                                          onChange={(e) =>
                                            handleUpdatePortions(entry.id, parseInt(e.target.value) || 1)
                                          }
                                          className="w-20"
                                        />
                                        <span className="text-sm text-gray-600">Port.</span>
                                      </div>
                                    </div>
                                    
                                    {/* Additional Recipes */}
                                    {entry.additionalRecipes && entry.additionalRecipes.length > 0 && (
                                      <>
                                        {entry.additionalRecipes.map((ar: any) => (
                                          <div key={ar.id} className="flex items-center justify-between p-2 bg-white rounded">
                                            <div className="flex-1">
                                              <div className="font-medium">{ar.recipe?.name}</div>
                                              <div className="text-xs text-gray-500">
                                                {ar.isAlternative ? "Alternative" : "Zusätzlich"}
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <Input
                                                type="number"
                                                min="1"
                                                max="500"
                                                value={ar.portions}
                                                onChange={(e) =>
                                                  handleUpdateRecipePortions(ar.id, parseInt(e.target.value) || 1)
                                                }
                                                className="w-20"
                                              />
                                              <span className="text-sm text-gray-600">Port.</span>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveRecipe(ar.id)}
                                              >
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                              </Button>
                                            </div>
                                          </div>
                                        ))}
                                      </>
                                    )}
                                    
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedEntryId(entry.id);
                                        setIsAddRecipeDialogOpen(true);
                                      }}
                                      className="w-full mt-2"
                                    >
                                      <Plus className="h-4 w-4 mr-1" />
                                      Weiteres Rezept hinzufügen
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Plan Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Neuen Menüplan erstellen</DialogTitle>
            <DialogDescription>Geben Sie die Details für Ihren Menüplan ein.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreatePlan} className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={newPlanData.name}
                onChange={(e) => setNewPlanData({ ...newPlanData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Startdatum *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newPlanData.startDate}
                  onChange={(e) => setNewPlanData({ ...newPlanData, startDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endDate">Enddatum *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newPlanData.endDate}
                  onChange={(e) => setNewPlanData({ ...newPlanData, endDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Beschreibung</Label>
              <Input
                id="description"
                value={newPlanData.description}
                onChange={(e) => setNewPlanData({ ...newPlanData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxBudgetPerDay">Max. Budget pro Tag (€)</Label>
                <Input
                  id="maxBudgetPerDay"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newPlanData.maxBudgetPerDay}
                  onChange={(e) => setNewPlanData({ ...newPlanData, maxBudgetPerDay: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="budgetTolerance">Toleranz (%)</Label>
                <Input
                  id="budgetTolerance"
                  type="number"
                  min="0"
                  max="100"
                  value={newPlanData.budgetTolerance}
                  onChange={(e) => setNewPlanData({ ...newPlanData, budgetTolerance: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={createPlanMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createPlanMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Erstellen...
                  </>
                ) : (
                  "Erstellen"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Meal Dialog */}
      <Dialog open={isAddMealDialogOpen} onOpenChange={setIsAddMealDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mahlzeit hinzufügen</DialogTitle>
            <DialogDescription>
              Fügen Sie eine Mahlzeit zu Ihrem Menüplan hinzu.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddMeal} className="space-y-4">
            <div>
              <Label htmlFor="mealType">Mahlzeitentyp *</Label>
              <Select
                value={newMealData.mealType}
                onValueChange={(value) => setNewMealData({ ...newMealData, mealType: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fruehstueck">Frühstück</SelectItem>
                  <SelectItem value="mittagessen">Mittagessen</SelectItem>
                  <SelectItem value="abendessen">Abendessen</SelectItem>
                  <SelectItem value="snack">Snack</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="recipe">Rezept *</Label>
              <Select
                value={newMealData.recipeId.toString()}
                onValueChange={(value) =>
                  setNewMealData({ ...newMealData, recipeId: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Rezept auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {recipes?.map((recipe) => (
                    <SelectItem key={recipe.id} value={recipe.id.toString()}>
                      {recipe.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="portions">Portionen *</Label>
              <Input
                id="portions"
                type="number"
                min="1"
                max="500"
                value={newMealData.portions}
                onChange={(e) =>
                  setNewMealData({ ...newMealData, portions: parseInt(e.target.value) || 1 })
                }
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddMealDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={addEntryMutation.isPending || !newMealData.recipeId}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {addEntryMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Hinzufügen...
                  </>
                ) : (
                  "Hinzufügen"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Recipe to Meal Dialog */}
      <Dialog open={isAddRecipeDialogOpen} onOpenChange={setIsAddRecipeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rezept zur Mahlzeit hinzufügen</DialogTitle>
            <DialogDescription>
              Fügen Sie ein weiteres Rezept (Beilage, Dessert, etc.) hinzu.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddRecipeToMeal} className="space-y-4">
            <div>
              <Label htmlFor="addRecipe">Rezept *</Label>
              <Select
                value={newRecipeData.recipeId.toString()}
                onValueChange={(value) =>
                  setNewRecipeData({ ...newRecipeData, recipeId: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Rezept auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {recipes?.map((recipe) => (
                    <SelectItem key={recipe.id} value={recipe.id.toString()}>
                      {recipe.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="addPortions">Portionen *</Label>
              <Input
                id="addPortions"
                type="number"
                min="1"
                max="500"
                value={newRecipeData.portions}
                onChange={(e) =>
                  setNewRecipeData({ ...newRecipeData, portions: parseInt(e.target.value) || 1 })
                }
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isAlternative"
                checked={newRecipeData.isAlternative}
                onChange={(e) =>
                  setNewRecipeData({ ...newRecipeData, isAlternative: e.target.checked })
                }
                className="rounded"
              />
              <Label htmlFor="isAlternative" className="cursor-pointer">
                Als Alternative markieren
              </Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddRecipeDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={addRecipeToEntryMutation.isPending || !newRecipeData.recipeId}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {addRecipeToEntryMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Hinzufügen...
                  </>
                ) : (
                  "Hinzufügen"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Duplicate Plan Dialog */}
      <Dialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Menüplan duplizieren</DialogTitle>
            <DialogDescription>
              Erstellen Sie eine Kopie dieses Menüplans für einen neuen Zeitraum.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDuplicatePlan} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dupStartDate">Neues Startdatum *</Label>
                <Input
                  id="dupStartDate"
                  type="date"
                  value={duplicateData.newStartDate}
                  onChange={(e) => setDuplicateData({ ...duplicateData, newStartDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="dupEndDate">Neues Enddatum *</Label>
                <Input
                  id="dupEndDate"
                  type="date"
                  value={duplicateData.newEndDate}
                  onChange={(e) => setDuplicateData({ ...duplicateData, newEndDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDuplicateDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={duplicatePlanMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {duplicatePlanMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Duplizieren...
                  </>
                ) : (
                  "Duplizieren"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Generate Order List Dialog */}
      <Dialog open={isGenerateOrderListDialogOpen} onOpenChange={setIsGenerateOrderListDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bestellliste generieren</DialogTitle>
            <DialogDescription>
              Erstellen Sie eine Bestellliste aus diesem Menüplan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleGenerateOrderList} className="space-y-4">
            <div>
              <Label htmlFor="orderListName">Name der Bestellliste</Label>
              <Input
                id="orderListName"
                value={orderListName}
                onChange={(e) => setOrderListName(e.target.value)}
                placeholder={`Bestellliste ${new Date().toLocaleDateString('de-DE')}`}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsGenerateOrderListDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={generateOrderListMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {generateOrderListMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generieren...
                  </>
                ) : (
                  "Generieren"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

