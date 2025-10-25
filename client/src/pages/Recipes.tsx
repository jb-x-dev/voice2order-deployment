import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ChefHat, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function Recipes() {
  const { user, loading: authLoading } = useAuth();
  const { data: recipes, isLoading, refetch } = trpc.recipes.list.useQuery(undefined, {
    enabled: !!user,
  });
  const createMutation = trpc.recipes.create.useMutation();
  const updateMutation = trpc.recipes.update.useMutation();
  const deleteMutation = trpc.recipes.delete.useMutation();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "hauptgericht" as any,
    defaultPortions: 4,
    ingredients: [{ name: "", quantity: "", unit: "", pricePerUnit: 0 }],
  });

  const handleOpenDialog = (recipe?: any) => {
    if (recipe) {
      setEditingRecipe(recipe);
      setFormData({
        name: recipe.name,
        description: recipe.description || "",
        category: recipe.category,
        defaultPortions: recipe.defaultPortions,
        ingredients: recipe.ingredients?.length > 0 
          ? recipe.ingredients.map((ing: any) => ({
              id: ing.id,
              name: ing.name,
              quantity: ing.quantity,
              unit: ing.unit,
              pricePerUnit: ing.pricePerUnit || 0,
            }))
          : [{ name: "", quantity: "", unit: "", pricePerUnit: 0 }],
      });
    } else {
      setEditingRecipe(null);
      setFormData({
        name: "",
        description: "",
        category: "hauptgericht",
        defaultPortions: 4,
        ingredients: [{ name: "", quantity: "", unit: "", pricePerUnit: 0 }],
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRecipe) {
        await updateMutation.mutateAsync({ id: editingRecipe.id, ...formData });
      } else {
        await createMutation.mutateAsync(formData);
      }
      setIsDialogOpen(false);
      refetch();
    } catch (error) {
      console.error("Fehler beim Speichern:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Möchten Sie dieses Rezept wirklich löschen?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      refetch();
    } catch (error) {
      console.error("Fehler beim Löschen:", error);
    }
  };

  const addIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { name: "", quantity: "", unit: "", pricePerUnit: 0 }],
    });
  };

  const removeIngredient = (index: number) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index),
    });
  };

  const updateIngredient = (index: number, field: string, value: any) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      hauptgericht: "Hauptgericht",
      beilage: "Beilage",
      dessert: "Dessert",
      vorspeise: "Vorspeise",
      getraenk: "Getränk",
      sonstiges: "Sonstiges",
    };
    return labels[category] || category;
  };

  if (authLoading || isLoading) {
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
            <CardDescription>Bitte melden Sie sich an, um Rezepte zu verwalten.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChefHat className="h-8 w-8 text-orange-600" />
            <h1 className="text-2xl font-bold text-gray-900">Rezeptverwaltung</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline">Startseite</Button>
            </Link>
            <Link href="/menu-planner">
              <Button variant="outline">Menüplaner</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex justify-between items-center">
          <p className="text-gray-600">
            {recipes?.length || 0} Rezept{recipes?.length !== 1 ? "e" : ""}
          </p>
          <Button onClick={() => handleOpenDialog()} className="bg-orange-600 hover:bg-orange-700">
            <Plus className="h-4 w-4 mr-2" />
            Neues Rezept
          </Button>
        </div>

        {!recipes || recipes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ChefHat className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Noch keine Rezepte vorhanden</p>
              <p className="text-sm text-gray-500 mt-2">
                Erstellen Sie Ihr erstes Rezept, um mit der Menüplanung zu beginnen.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <Card key={recipe.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{recipe.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {getCategoryLabel(recipe.category)}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(recipe)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(recipe.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {recipe.description && (
                    <p className="text-sm text-gray-600 mb-3">{recipe.description}</p>
                  )}
                  <div className="text-sm text-gray-500">
                    Standard: {recipe.defaultPortions} Portionen
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRecipe ? "Rezept bearbeiten" : "Neues Rezept erstellen"}
            </DialogTitle>
            <DialogDescription>
              Geben Sie die Details für Ihr Rezept ein.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Rezeptname *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Kategorie *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hauptgericht">Hauptgericht</SelectItem>
                  <SelectItem value="beilage">Beilage</SelectItem>
                  <SelectItem value="dessert">Dessert</SelectItem>
                  <SelectItem value="vorspeise">Vorspeise</SelectItem>
                  <SelectItem value="getraenk">Getränk</SelectItem>
                  <SelectItem value="sonstiges">Sonstiges</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="defaultPortions">Standard-Portionen *</Label>
              <Input
                id="defaultPortions"
                type="number"
                min="1"
                max="500"
                value={formData.defaultPortions}
                onChange={(e) =>
                  setFormData({ ...formData, defaultPortions: parseInt(e.target.value) || 1 })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Zutaten</Label>
                <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
                  <Plus className="h-4 w-4 mr-1" />
                  Zutat hinzufügen
                </Button>
              </div>

              <div className="space-y-3">
                {formData.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1 grid grid-cols-4 gap-2">
                      <Input
                        placeholder="Name"
                        value={ingredient.name}
                        onChange={(e) => updateIngredient(index, "name", e.target.value)}
                        className="col-span-2"
                      />
                      <Input
                        placeholder="Menge"
                        value={ingredient.quantity}
                        onChange={(e) => updateIngredient(index, "quantity", e.target.value)}
                      />
                      <Input
                        placeholder="Einheit"
                        value={ingredient.unit}
                        onChange={(e) => updateIngredient(index, "unit", e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeIngredient(index)}
                      disabled={formData.ingredients.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Speichern...
                  </>
                ) : (
                  "Speichern"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

