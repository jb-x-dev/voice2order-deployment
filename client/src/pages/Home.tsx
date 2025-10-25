import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { Calendar, ChefHat, TrendingUp, Utensils } from "lucide-react";
import { Link } from "wouter";

/**
 * All content in this page are only for example, delete if unneeded
 * When building pages, remember your instructions in Frontend Workflow, Frontend Best Practices, Design Guide and Common Pitfalls
 */
export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  // If theme is switchable in App.tsx, we can implement theme toggling like this:
  // const { theme, toggleTheme } = useTheme();

  // Use APP_LOGO (as image src) and APP_TITLE if needed

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <div className="text-center space-y-6 max-w-2xl px-4">
          <div className="flex justify-center mb-8">
            <div className="bg-white p-6 rounded-full shadow-lg">
              <ChefHat className="h-16 w-16 text-orange-600" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            {APP_TITLE}
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            Professionelle Menüplanung für Hotels und Gastronomie
          </p>
          
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Willkommen</CardTitle>
              <CardDescription className="text-base">
                Planen Sie Ihre Menüs effizient mit unserem intelligenten Simulator
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg">
                  <Utensils className="h-6 w-6 text-orange-600 mt-1" />
                  <div>
                    <div className="font-semibold mb-1">Rezeptverwaltung</div>
                    <p className="text-sm text-gray-600">
                      Erstellen und verwalten Sie Ihre Rezepte mit Zutaten und Portionen
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600 mt-1" />
                  <div>
                    <div className="font-semibold mb-1">Menüplanung</div>
                    <p className="text-sm text-gray-600">
                      Planen Sie Wochen- und Monatspläne mit flexibler Portionsanpassung
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600 mt-1" />
                  <div>
                    <div className="font-semibold mb-1">Kostenberechnung</div>
                    <p className="text-sm text-gray-600">
                      Automatische Berechnung der Kosten basierend auf Portionen
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
                  <ChefHat className="h-6 w-6 text-purple-600 mt-1" />
                  <div>
                    <div className="font-semibold mb-1">Mehrere Rezepte</div>
                    <p className="text-sm text-gray-600">
                      Kombinieren Sie Hauptgerichte, Beilagen und Desserts
                    </p>
                  </div>
                </div>
              </div>
              
              <Button 
                className="w-full bg-orange-600 hover:bg-orange-700 text-lg py-6" 
                size="lg"
                onClick={() => window.location.href = getLoginUrl()}
              >
                Jetzt anmelden und starten
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChefHat className="h-8 w-8 text-orange-600" />
            <h1 className="text-2xl font-bold text-gray-900">{APP_TITLE}</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user?.name || user?.email}
            </span>
            <Button variant="outline" onClick={() => logout()}>
              Abmelden
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Willkommen zurück!
            </h2>
            <p className="text-xl text-gray-600">
              Wählen Sie eine Funktion, um zu beginnen
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Link href="/recipes">
              <Card className="cursor-pointer hover:shadow-xl transition-shadow h-full">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-orange-100 p-3 rounded-lg">
                      <Utensils className="h-8 w-8 text-orange-600" />
                    </div>
                    <CardTitle className="text-2xl">Rezeptverwaltung</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    Erstellen und verwalten Sie Ihre Rezepte
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Rezepte mit Zutaten anlegen</li>
                    <li>• Kategorien zuordnen</li>
                    <li>• Standard-Portionen festlegen</li>
                    <li>• Preise pro Zutat erfassen</li>
                  </ul>
                </CardContent>
              </Card>
            </Link>

            <Link href="/menu-planner">
              <Card className="cursor-pointer hover:shadow-xl transition-shadow h-full">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <Calendar className="h-8 w-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-2xl">Menüplaner</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    Planen Sie Ihre Menüs für Wochen und Monate
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Wochen- und Monatspläne erstellen</li>
                    <li>• Mehrere Mahlzeiten pro Tag</li>
                    <li>• Portionen individuell anpassen (1-500)</li>
                    <li>• Automatische Kostenberechnung</li>
                  </ul>
                </CardContent>
              </Card>
            </Link>
          </div>

          <Card className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
            <CardContent className="py-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Bereit zum Starten?</h3>
                  <p className="text-orange-100">
                    Erstellen Sie Ihr erstes Rezept oder planen Sie direkt einen Menüplan
                  </p>
                </div>
                <ChefHat className="h-16 w-16 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
