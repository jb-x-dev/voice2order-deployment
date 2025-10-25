import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Calendar, ChefHat, Loader2, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";

export default function MenuPlanner() {
  const { user, loading: authLoading } = useAuth();
  const { data: menuPlans, isLoading: plansLoading, refetch: refetchPlans } = trpc.menuPlans.list.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: recipes } = trpc.recipes.list.useQuery(undefined, {
    enabled: !!user,
  });

  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const { data: selectedPlan, refetch: refetchPlan } = trpc.menuPlans.get.useQuery(
    { id: selectedPlanId! },
    { enabled: !!selectedPlanId }
  );

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddMealDialogOpen, setIsAddMealDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [newPlanData, setNewPlanData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    description: "",
  });

  const [newMealData, setNewMealData] = useState({
    mealType: "mittagessen" as any,
    recipeId: 0,
    portions: 4,
    notes: "",
  });

  const createPlanMutation = trpc.menuPlans.create.useMutation();
  const deletePlanMutation = trpc.menuPlans.delete.useMutation();
  const addEntryMutation = trpc.menuPlans.addEntry.useMutation();
  const updateEntryMutation = trpc.menuPlans.updateEntry.useMutation();
  const deleteEntryMutation = trpc.menuPlans.deleteEntry.useMutation();

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPlanMutation.mutateAsync({
        name: newPlanData.name,
        startDate: new Date(newPlanData.startDate),
        endDate: new Date(newPlanData.endDate),
        description: newPlanData.description,
      });
      setIsCreateDialogOpen(false);
      setNewPlanData({ name: "", startDate: "", endDate: "", description: "" });
      refetchPlans();
    } catch (error) {
      console.error("Fehler beim Erstellen:", error);
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

  const handleDeleteEntry = async (entryId: number) => {
    if (!confirm("Möchten Sie diese Mahlzeit wirklich entfernen?")) return;
    try {
      await deleteEntryMutation.mutateAsync({ id: entryId });
      refetchPlan();
    } catch (error) {
      console.error("Fehler beim Löschen:", error);
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

  const calculateTotalCost = () => {
    if (!selectedPlan?.entries) return 0;
    return selectedPlan.entries.reduce((total, entry) => {
      const ingredients = entry.recipe?.ingredients || [];
      const recipeCost = ingredients.reduce((sum, ing) => sum + (ing.pricePerUnit || 0), 0);
      return total + (recipeCost * entry.portions) / (entry.recipe?.defaultPortions || 1);
    }, 0);
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Menüplaner</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline">Startseite</Button>
            </Link>
            <Link href="/recipes">
              <Button variant="outline">Rezepte</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
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
                          <div>
                            <div className="font-medium">{plan.name}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(plan.startDate).toLocaleDateString("de-DE")} -{" "}
                              {new Date(plan.endDate).toLocaleDateString("de-DE")}
                            </div>
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
          <div className="lg:col-span-2">
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
                    <CardTitle>{selectedPlan.name}</CardTitle>
                    <CardDescription>
                      {new Date(selectedPlan.startDate).toLocaleDateString("de-DE")} -{" "}
                      {new Date(selectedPlan.endDate).toLocaleDateString("de-DE")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-gray-600">Gesamtkosten</div>
                        <div className="text-2xl font-bold text-blue-600">
                          {(calculateTotalCost() / 100).toFixed(2)} €
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Mahlzeiten</div>
                        <div className="text-2xl font-bold">{selectedPlan.entries?.length || 0}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tage */}
                <div className="space-y-4">
                  {planDays.map((day) => {
                    const entries = getEntriesForDate(day);
                    return (
                      <Card key={day.toISOString()}>
                        <CardHeader>
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">
                              {day.toLocaleDateString("de-DE", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </CardTitle>
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
                            <div className="space-y-3">
                              {entries.map((entry) => (
                                <div
                                  key={entry.id}
                                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                  <div className="flex-1">
                                    <div className="font-medium">{entry.recipe?.name}</div>
                                    <div className="text-sm text-gray-600">
                                      {getMealTypeLabel(entry.mealType)}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
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
                                      <span className="text-sm text-gray-600">Portionen</span>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteEntry(entry.id)}
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
        <DialogContent>
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
    </div>
  );
}

