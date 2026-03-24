import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";

interface CityDistrictFiltersProps {
    onFiltersChange: (filters: { city?: string; district?: string }) => void;
}

interface City {
    city: string;
    district: string;
    state: string;
}

export default function CityDistrictFilters({ onFiltersChange }: CityDistrictFiltersProps) {
    const [cities, setCities] = useState<City[]>([]);
    const [selectedCity, setSelectedCity] = useState<string>("");
    const [selectedDistrict, setSelectedDistrict] = useState<string>("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCities();
    }, []);

    const fetchCities = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/cities");
            if (response.ok) {
                const data = await response.json();
                setCities(data.cities || []);
            }
        } catch (error) {
            console.error("Failed to fetch cities:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCityChange = (city: string) => {
        setSelectedCity(city);
        setSelectedDistrict("");
        onFiltersChange({ city: city || undefined, district: undefined });
    };

    const handleDistrictChange = (district: string) => {
        setSelectedDistrict(district);
        onFiltersChange({ city: selectedCity || undefined, district: district || undefined });
    };

    const uniqueCities = Array.from(new Set(cities.map(c => c.city))).sort();
    const districtsForCity = selectedCity
        ? Array.from(new Set(cities.filter(c => c.city === selectedCity).map(c => c.district))).sort()
        : [];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <Label htmlFor="city-filter" className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4" />
                    City
                </Label>
                <select
                    id="city-filter"
                    value={selectedCity}
                    onChange={(e) => handleCityChange(e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:border-gray-600"
                >
                    <option value="">All Cities</option>
                    {uniqueCities.map((city) => (
                        <option key={city} value={city}>
                            {city}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <Label htmlFor="district-filter" className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4" />
                    District
                </Label>
                <select
                    id="district-filter"
                    value={selectedDistrict}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    disabled={loading || !selectedCity}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:border-gray-600 disabled:opacity-50"
                >
                    <option value="">All Districts</option>
                    {districtsForCity.map((district) => (
                        <option key={district} value={district}>
                            {district}
                        </option>
                    ))}
                </select>
                {!selectedCity && (
                    <p className="text-xs text-gray-500 mt-1">Select a city first</p>
                )}
            </div>
        </div>
    );
}
