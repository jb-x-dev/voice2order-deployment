import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { ClipboardList, Loader2, Trash2, FileDown, FileJson, FileSpreadsheet } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function OrderListManager() {
  const { user, loading: authLoading } = useAuth();
  const { data: orderLists, isLoading: listsLoading, refetch: refetchLists } = trpc.orderLists.list.useQuery(undefined, {
    enabled: !!user,
  });

  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const { data: selectedList, refetch: refetchList } = trpc.orderLists.get.useQuery(
    { id: selectedListId! },
    { enabled: !!selectedListId }
  );

  const deleteListMutation = trpc.orderLists.delete.useMutation();

  const handleDeleteList = async (id: number) => {
    if (!confirm("Möchten Sie diese Bestellliste wirklich löschen?")) return;
    try {
      await deleteListMutation.mutateAsync({ id });
      if (selectedListId === id) setSelectedListId(null);
      refetchLists();
    } catch (error) {
      console.error("Fehler beim Löschen:", error);
      alert("Fehler beim Löschen der Bestellliste");
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      entwurf: "Entwurf",
      bestaetigt: "Bestätigt",
      bestellt: "Bestellt",
      archiviert: "Archiviert",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      entwurf: "bg-gray-100 text-gray-800",
      bestaetigt: "bg-blue-100 text-blue-800",
      bestellt: "bg-green-100 text-green-800",
      archiviert: "bg-yellow-100 text-yellow-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
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

  const groupIngredientsByOrderDay = () => {
    if (!selectedList?.items) return {};
    
    const grouped: Record<string, any[]> = {};
    
    selectedList.items.forEach((item) => {
      const orderDay = new Date(item.orderDay);
      const leadTime = item.leadTime || 0;
      const actualOrderDay = new Date(orderDay);
      actualOrderDay.setDate(actualOrderDay.getDate() - leadTime);
      
      const dateKey = actualOrderDay.toISOString().split('T')[0];
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      
      const ingredients = item.recipe?.ingredients || [];
      ingredients.forEach((ing: any) => {
        const existingIng = grouped[dateKey].find((g: any) => g.name === ing.name && g.unit === ing.unit);
        
        if (existingIng) {
          existingIng.totalQuantity += parseFloat(ing.quantity) * item.portions / (item.recipe?.defaultPortions || 1);
          existingIng.totalPrice += (ing.pricePerUnit || 0) * item.portions / (item.recipe?.defaultPortions || 1);
        } else {
          grouped[dateKey].push({
            name: ing.name,
            unit: ing.unit,
            totalQuantity: parseFloat(ing.quantity) * item.portions / (item.recipe?.defaultPortions || 1),
            totalPrice: (ing.pricePerUnit || 0) * item.portions / (item.recipe?.defaultPortions || 1),
            pricePerUnit: ing.pricePerUnit || 0,
          });
        }
      });
    });
    
    return grouped;
  };

  const handleExportJSON = () => {
    if (!selectedList) return;
    
    const data = {
      name: selectedList.name,
      createdAt: selectedList.createdAt,
      items: selectedList.items.map((item) => ({
        orderDay: item.orderDay,
        recipe: item.recipe?.name,
        portions: item.portions,
        ingredients: item.recipe?.ingredients || [],
      })),
      ingredientsByDay: groupIngredientsByOrderDay(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedList.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (!selectedList) return;
    
    let csv = "Tag,Rezept,Portionen\n";
    selectedList.items.forEach((item) => {
      csv += `${new Date(item.orderDay).toLocaleDateString('de-DE')},${item.recipe?.name},${item.portions}\n`;
    });
    
    csv += "\n\nBestelltag,Zutat,Menge,Einheit,Preis\n";
    const grouped = groupIngredientsByOrderDay();
    Object.entries(grouped).forEach(([date, ingredients]) => {
      ingredients.forEach((ing: any) => {
        csv += `${new Date(date).toLocaleDateString('de-DE')},${ing.name},${ing.totalQuantity.toFixed(2)},${ing.unit},${(ing.totalPrice / 100).toFixed(2)} €\n`;
      });
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedList.name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading || listsLoading) {
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
            <CardDescription>Bitte melden Sie sich an, um Bestelllisten zu verwalten.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const groupedIngredients = groupIngredientsByOrderDay();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900">Bestelllisten-Manager</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline">Startseite</Button>
            </Link>
            <Link href="/menu-planner-v2">
              <Button variant="outline">Menüplaner</Button>
            </Link>
            <Link href="/recipes">
              <Button variant="outline">Rezepte</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Sidebar - Bestelllisten */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Meine Bestelllisten</CardTitle>
              </CardHeader>
              <CardContent>
                {!orderLists || orderLists.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Noch keine Bestelllisten vorhanden
                  </p>
                ) : (
                  <div className="space-y-2">
                    {orderLists.map((list) => (
                      <div
                        key={list.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedListId === list.id
                            ? "bg-green-50 border-green-300"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedListId(list.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium">{list.name}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(list.createdAt).toLocaleDateString("de-DE")}
                            </div>
                            <Badge className={`mt-2 ${getStatusColor(list.status || "entwurf")}`}>
                              {getStatusLabel(list.status || "entwurf")}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteList(list.id);
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

          {/* Main Content - Bestelllisten Details */}
          <div className="lg:col-span-3">
            {!selectedList ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Wählen Sie eine Bestellliste aus</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{selectedList.name}</CardTitle>
                        <CardDescription>
                          Erstellt am {new Date(selectedList.createdAt).toLocaleDateString("de-DE")}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleExportJSON}
                        >
                          <FileJson className="h-4 w-4 mr-1" />
                          JSON
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleExportCSV}
                        >
                          <FileSpreadsheet className="h-4 w-4 mr-1" />
                          CSV
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Menüplan-Übersicht */}
                <Card>
                  <CardHeader>
                    <CardTitle>Menüplan-Übersicht</CardTitle>
                    <CardDescription>Alle Mahlzeiten in dieser Bestellliste</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tag</TableHead>
                          <TableHead>Rezept</TableHead>
                          <TableHead className="text-right">Portionen</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedList.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              {new Date(item.orderDay).toLocaleDateString("de-DE", {
                                weekday: "short",
                                day: "2-digit",
                                month: "2-digit",
                              })}
                            </TableCell>
                            <TableCell>{item.recipe?.name}</TableCell>
                            <TableCell className="text-right">{item.portions}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Zutaten nach Bestelltag */}
                <Card>
                  <CardHeader>
                    <CardTitle>Zutaten nach Bestelltag</CardTitle>
                    <CardDescription>
                      Gruppiert nach dem Tag, an dem bestellt werden muss (inkl. Vorlaufzeit)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {Object.entries(groupedIngredients)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([date, ingredients]) => (
                          <div key={date} className="border rounded-lg p-4">
                            <h3 className="font-semibold text-lg mb-3">
                              {new Date(date).toLocaleDateString("de-DE", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </h3>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Zutat</TableHead>
                                  <TableHead className="text-right">Menge</TableHead>
                                  <TableHead>Einheit</TableHead>
                                  <TableHead className="text-right">Preis</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {ingredients.map((ing: any, idx: number) => (
                                  <TableRow key={idx}>
                                    <TableCell className="font-medium">{ing.name}</TableCell>
                                    <TableCell className="text-right">
                                      {ing.totalQuantity.toFixed(2)}
                                    </TableCell>
                                    <TableCell>{ing.unit}</TableCell>
                                    <TableCell className="text-right">
                                      {(ing.totalPrice / 100).toFixed(2)} €
                                    </TableCell>
                                  </TableRow>
                                ))}
                                <TableRow className="font-semibold bg-gray-50">
                                  <TableCell colSpan={3}>Gesamt</TableCell>
                                  <TableCell className="text-right">
                                    {(
                                      ingredients.reduce(
                                        (sum: number, ing: any) => sum + ing.totalPrice,
                                        0
                                      ) / 100
                                    ).toFixed(2)}{" "}
                                    €
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Gesamtübersicht */}
                <Card>
                  <CardHeader>
                    <CardTitle>Gesamtübersicht</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Anzahl Mahlzeiten</div>
                        <div className="text-2xl font-bold">{selectedList.items.length}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Bestelltage</div>
                        <div className="text-2xl font-bold">
                          {Object.keys(groupedIngredients).length}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Gesamtkosten</div>
                        <div className="text-2xl font-bold text-green-600">
                          {(
                            Object.values(groupedIngredients)
                              .flat()
                              .reduce((sum: number, ing: any) => sum + ing.totalPrice, 0) / 100
                          ).toFixed(2)}{" "}
                          €
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

