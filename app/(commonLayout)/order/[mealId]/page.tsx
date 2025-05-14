/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useGetMealByIdQuery } from "@/redux/meal/mealApi";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock,
  Utensils,
  DollarSign,
  Star,
  ChefHat,
  CheckCircle2,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMealImageUrl } from "./addToCartUtils";
import AddToCartButton from "./AddToCartButton";

// Meal interface used for API response typing
type Meal = {
  _id: string;
  name: string;
  description: string;
  price: number;
  providerId:
    | string
    | {
        _id: string;
        name: string;
        email: string;
      };
  providerName?: string;
  ingredients: string[];
  portionSize: string;
  image: string;
  category: string;
  preparationTime: number;
  isAvailable: boolean;
  rating?: number;
  reviewCount?: number;
  ratings?: {
    average: number;
    count: number;
    reviews: Array<{
      userId: string;
      rating: number;
      comment: string;
      createdAt: string;
    }>;
  };
  nutritionalInfo: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  customizationOptions: {
    removeIngredients: string[];
    addOns: {
      name: string;
      price: number;
      _id: string;
    }[];
    spiceLevel: string[];
    noteToChef: boolean;
  };
};

const LoadingSkeleton = () => {
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      <div>
        <Skeleton className="aspect-video w-full" />
        <Skeleton className="mt-4 h-10 w-3/4" />
        <Skeleton className="mt-2 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-3/4" />
      </div>
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
};

export default function OrderPage() {
  const router = useRouter();
  const { mealId } = useParams() as { mealId: string };

  const {
    data: mealData,
    isLoading,
    isError,
  } = useGetMealByIdQuery({ id: mealId });
  const meal = mealData?.data;

  const [quantity, setQuantity] = useState(1);
  const [noteToChef, setNoteToChef] = useState("");
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [spiceLevel, setSpiceLevel] = useState<string>("medium");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [deliveryAddress] = useState<string>("");
  const [availableDates, setAvailableDates] = useState<
    Array<{ date: string; day: number; available: number }>
  >([]);
  const [currentMonth, setCurrentMonth] = useState<string>("");

  // Initialize calendar data
  useEffect(() => {
    // Generate the next 7 days for delivery dates
    const dates = [];
    const today = new Date();
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    setCurrentMonth(`${monthNames[today.getMonth()]} ${today.getFullYear()}`);

    // Start from tomorrow
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);

      dates.push({
        date: date.toISOString().split("T")[0],
        day: date.getDate(),
        available: 10, // Mock availability
      });
    }

    setAvailableDates(dates);
    setSelectedDate(dates[0].date); // Select first date by default
  }, []);

  const timeSlots = [
    "9 AM - 10 AM",
    "10 AM - 11 AM",
    "11 AM - 12 PM",
    "12 PM - 1 PM",
    "1 PM - 2 PM",
    "2 PM - 3 PM",
    "3 PM - 4 PM",
    "4 PM - 5 PM",
    "5 PM - 6 PM",
  ];

  const handleAddOnToggle = (addOnId: string) => {
    setSelectedAddOns((prev) =>
      prev.includes(addOnId)
        ? prev.filter((id) => id !== addOnId)
        : [...prev, addOnId],
    );
  };

  const handleIngredientToggle = (ingredient: string) => {
    setRemovedIngredients((prev) =>
      prev.includes(ingredient)
        ? prev.filter((ing) => ing !== ingredient)
        : [...prev, ingredient],
    );
  };

  const calculateTotal = () => {
    if (!meal) return 0;

    let total = meal.price * quantity;

    // Add price for selected add-ons
    if (selectedAddOns.length > 0 && meal.customizationOptions.addOns) {
      meal.customizationOptions.addOns.forEach(
        (addOn: { _id: string; price: number }) => {
          if (selectedAddOns.includes(addOn._id)) {
            total += addOn.price * quantity;
          }
        },
      );
    }

    return total.toFixed(2);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setQuantity(value);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="mb-8 text-3xl font-bold">Customize Your Order</h1>
        <LoadingSkeleton />
      </div>
    );
  }

  if (isError || !meal) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="mb-4 text-3xl font-bold">Meal Not Found</h1>
        <p className="mb-6 text-gray-600">
          Sorry, we could not find the meal you are looking for.
        </p>
        <Button onClick={() => router.push("/find-meals")}>
          Browse All Meals
        </Button>
      </div>
    );
  }

  // Ensure meal is properly typed as Meal
  const typedMeal: Meal = meal;

  // Get provider name
  const providerName =
    typeof typedMeal.providerName === "string"
      ? typedMeal.providerName
      : typeof typedMeal.providerId === "object" && typedMeal.providerId?.name
        ? typedMeal.providerId.name
        : typeof typedMeal.providerId === "string"
          ? typedMeal.providerId
          : "Unknown Provider";

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-3xl font-bold">Customize Your Order</h1>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <Card>
          <div className="relative aspect-video">
            <Image
              src={typedMeal.image}
              alt={typedMeal.name}
              fill
              className="object-cover"
            />
            <Badge
              className="absolute top-2 right-2 bg-white text-black hover:bg-white"
              variant="secondary"
            >
              {typedMeal.category}
            </Badge>
          </div>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-xl">{typedMeal.name}</span>
              <span className="text-feed-jungle/70 text-lg font-semibold">
                ৳{typedMeal.price.toFixed(2)}
              </span>
            </CardTitle>

            <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
              <ChefHat className="h-4 w-4" />
              <span>{providerName}</span>
            </div>

            <div className="mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`inline-block h-4 w-4 ${
                    star <=
                    (typedMeal.ratings?.average || typedMeal.rating || 4)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
              <span className="ml-1 text-xs text-gray-500">
                ({typedMeal.ratings?.count || typedMeal.reviewCount || 2})
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-600">{typedMeal.description}</p>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {typedMeal.ingredients.map(
                  (ingredient: string, index: number) => (
                    <Badge key={index} variant="outline" className="bg-gray-50">
                      {ingredient}
                    </Badge>
                  ),
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Utensils className="h-4 w-4" />
                  <span>{typedMeal.portionSize}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{typedMeal.preparationTime} mins</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span className="font-medium">
                  {typedMeal.nutritionalInfo.calories} cal
                </span>
                <span>•</span>
                <span className="font-medium">
                  {typedMeal.nutritionalInfo.protein}g protein
                </span>
                <span>•</span>
                <span className="font-medium">
                  {typedMeal.nutritionalInfo.carbs}g carbs
                </span>
                <span>•</span>
                <span className="font-medium">
                  {typedMeal.nutritionalInfo.fat}g fat
                </span>
              </div>

              {/* Customer Reviews Section */}
              <div className="mt-4 border-t pt-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-medium">Customer Reviews</h3>
                  <div className="flex items-center">
                    <Star className="mr-1 h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">
                      {typedMeal.ratings?.average?.toFixed(1) ||
                        typedMeal.rating ||
                        "0"}
                    </span>
                    <span className="mx-1 text-gray-400">•</span>
                    <span className="text-sm text-gray-500">
                      {typedMeal.ratings?.count || typedMeal.reviewCount || 0}{" "}
                      reviews
                    </span>
                  </div>
                </div>

                {typedMeal.ratings?.reviews &&
                typedMeal.ratings.reviews.length > 0 ? (
                  <div className="space-y-4">
                    {typedMeal.ratings.reviews.map((review, index) => {
                      // Format the review date directly
                      let displayDate = "Recently";
                      try {
                        const reviewDate = new Date(review.createdAt);

                        if (!isNaN(reviewDate.getTime())) {
                          const now = new Date();
                          const diffTime = Math.abs(
                            now.getTime() - reviewDate.getTime(),
                          );
                          const diffDays = Math.ceil(
                            diffTime / (1000 * 60 * 60 * 24),
                          );

                          if (diffDays < 1) {
                            displayDate = "Today";
                          } else if (diffDays <= 2) {
                            displayDate = "Yesterday";
                          } else if (diffDays < 7) {
                            displayDate = `${diffDays} days ago`;
                          } else if (diffDays < 30) {
                            const weeks = Math.floor(diffDays / 7);
                            displayDate = `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
                          } else {
                            displayDate = reviewDate.toLocaleDateString(
                              undefined,
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            );
                          }
                        }
                      } catch (e) {
                        console.error("Error formatting date:", e);
                        // Keep default "Recently"
                      }

                      // Get user name from userId since customerName doesn't exist
                      let userName = "Customer";
                      let userInitials = "CU";

                      // Extract initials from userId
                      if (review.userId) {
                        // Use userId for display
                        const shortId = review.userId.substring(0, 4);
                        userName = `Customer ${shortId}`;
                        userInitials = shortId.substring(0, 2).toUpperCase();
                      }

                      return (
                        <div
                          key={index}
                          className="border-b pb-3 last:border-b-0"
                        >
                          <div className="flex items-start">
                            <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-800">
                              {userInitials}
                            </div>
                            <div className="flex-1">
                              <div className="mb-1 flex items-center justify-between">
                                <span className="text-sm font-medium">
                                  {userName}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {displayDate}
                                </span>
                              </div>
                              <div className="mb-1 flex items-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-4 w-4 ${
                                      star <= review.rating
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              <p className="mt-1 text-sm text-gray-700">
                                {review.comment || "This meal was delicious!"}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg bg-gray-50 p-4 text-center">
                    <p className="mb-1 text-sm text-gray-500">
                      No reviews yet.
                    </p>
                    <p className="text-xs text-gray-400">
                      Be the first to review this meal after ordering!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Tabs defaultValue="schedule" className="mb-6 w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="schedule">
                      Schedule & Quantity
                    </TabsTrigger>
                    <TabsTrigger value="customize">Customize Meal</TabsTrigger>
                  </TabsList>

                  <TabsContent value="schedule" className="mt-4">
                    <h3 className="mb-4 text-lg font-medium">Choose a date</h3>
                    <div className="mb-2 flex items-center">
                      <span className="text-lg font-medium">
                        {currentMonth}
                      </span>
                      <CheckCircle2 className="ml-2 h-5 w-5 text-green-500" />
                    </div>

                    <div className="mb-6 grid grid-cols-7 gap-2 text-center">
                      <div className="text-sm font-medium text-green-600">
                        Sun
                      </div>
                      <div className="text-sm font-medium text-green-600">
                        Mon
                      </div>
                      <div className="text-sm font-medium text-green-600">
                        Tue
                      </div>
                      <div className="text-sm font-medium text-green-600">
                        Wed
                      </div>
                      <div className="text-sm font-medium text-green-600">
                        Thu
                      </div>
                      <div className="text-sm font-medium text-green-600">
                        Fri
                      </div>
                      <div className="text-sm font-medium text-green-600">
                        Sat
                      </div>

                      {availableDates.map((dateObj) => (
                        <div
                          key={dateObj.date}
                          onClick={() => setSelectedDate(dateObj.date)}
                          className={`flex cursor-pointer flex-col items-center justify-center rounded-full p-2 ${
                            selectedDate === dateObj.date
                              ? "bg-green-500 text-white"
                              : "hover:bg-green-100"
                          }`}
                        >
                          <div className="text-sm">{dateObj.day}</div>
                          <div className="text-xs">
                            {dateObj.available} left
                          </div>
                        </div>
                      ))}
                    </div>

                    <h3 className="mb-4 text-lg font-medium">Delivery Slot</h3>
                    <div className="mb-6 grid grid-cols-3 gap-2">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTimeSlot(slot)}
                          className={`rounded-full px-4 py-2 text-sm ${
                            selectedTimeSlot === slot
                              ? "bg-green-500 text-white"
                              : "bg-green-100 text-green-800 hover:bg-green-200"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>

                    <h3 className="mb-2 text-lg font-medium">Quantity</h3>
                    <div className="mb-6 flex items-center justify-between">
                      <span>
                        {availableDates.find((d) => d.date === selectedDate)
                          ?.available || 10}{" "}
                        available
                      </span>
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() =>
                            quantity > 1 && setQuantity(quantity - 1)
                          }
                          className="flex h-10 w-10 items-center justify-center rounded-l border border-gray-300"
                        >
                          -
                        </button>
                        <Input
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={handleQuantityChange}
                          className="h-10 w-16 border-t border-b border-gray-300 text-center"
                        />
                        <button
                          type="button"
                          onClick={() => setQuantity(quantity + 1)}
                          className="flex h-10 w-10 items-center justify-center rounded-r border border-gray-300"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="customize" className="mt-4 space-y-6">
                    {typedMeal.customizationOptions.spiceLevel &&
                      typedMeal.customizationOptions.spiceLevel.length > 0 && (
                        <div>
                          <Label className="mb-2 block text-lg font-medium">
                            Spice Level
                          </Label>
                          <RadioGroup
                            value={spiceLevel}
                            onValueChange={(value) =>
                              setSpiceLevel(value.toLowerCase())
                            }
                            className="mt-2"
                          >
                            {typedMeal.customizationOptions.spiceLevel.map(
                              (level: string, index: number) => (
                                <div
                                  key={index}
                                  className="mb-2 flex items-center space-x-2"
                                >
                                  <RadioGroupItem
                                    value={level.toLowerCase()}
                                    id={`spice-${level}`}
                                  />
                                  <Label htmlFor={`spice-${level}`}>
                                    {level}
                                  </Label>
                                </div>
                              ),
                            )}
                          </RadioGroup>
                        </div>
                      )}

                    {typedMeal.customizationOptions.removeIngredients &&
                      typedMeal.customizationOptions.removeIngredients.length >
                        0 && (
                        <div>
                          <Label className="mb-2 block text-lg font-medium">
                            Remove Ingredients
                          </Label>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            {typedMeal.ingredients.map(
                              (ingredient: string, index: number) => (
                                <div
                                  key={index}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`remove-${ingredient}`}
                                    checked={removedIngredients.includes(
                                      ingredient,
                                    )}
                                    onCheckedChange={() =>
                                      handleIngredientToggle(ingredient)
                                    }
                                  />
                                  <Label htmlFor={`remove-${ingredient}`}>
                                    No {ingredient}
                                  </Label>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                    {typedMeal.customizationOptions.addOns &&
                      typedMeal.customizationOptions.addOns.length > 0 && (
                        <div>
                          <Label className="mb-2 block text-lg font-medium">
                            Add-ons
                          </Label>
                          <div className="mt-2 space-y-2">
                            {typedMeal.customizationOptions.addOns.map(
                              (addOn: {
                                _id: string;
                                name: string;
                                price: number;
                              }) => (
                                <div
                                  key={addOn._id}
                                  className="flex items-center justify-between border-b pb-2"
                                >
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`addon-${addOn._id}`}
                                      checked={selectedAddOns.includes(
                                        addOn._id,
                                      )}
                                      onCheckedChange={() =>
                                        handleAddOnToggle(addOn._id)
                                      }
                                    />
                                    <Label htmlFor={`addon-${addOn._id}`}>
                                      {addOn.name}
                                    </Label>
                                  </div>
                                  <span className="font-medium text-green-600">
                                    +${addOn.price.toFixed(2)}
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                    {typedMeal.customizationOptions.noteToChef && (
                      <div>
                        <Label
                          htmlFor="notes"
                          className="mb-2 block text-lg font-medium"
                        >
                          Special Instructions
                        </Label>
                        <Textarea
                          id="notes"
                          placeholder="e.g. Make the gravy extra spicy"
                          value={noteToChef}
                          onChange={(e) => setNoteToChef(e.target.value)}
                          className="mt-2"
                        />
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              <Separator />

              <div className="space-y-4 pt-4">
                <div className="text-right text-xl font-semibold">
                  Total: ৳{calculateTotal()}
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {meal && (
                    <AddToCartButton
                      meal={{
                        _id: meal._id,
                        name: meal.name,
                        price: meal.price,
                        imageUrl: getMealImageUrl(meal),
                        provider: {
                          _id:
                            typeof meal.providerId === "string"
                              ? meal.providerId
                              : (meal.providerId as any)?._id,
                          name:
                            typeof meal.providerId === "string"
                              ? meal.providerName || "Provider"
                              : (meal.providerId as any)?.name,
                        },
                      }}
                      quantity={quantity}
                      deliveryDate={selectedDate}
                      deliverySlot={selectedTimeSlot}
                      deliveryAddress={deliveryAddress || "Default Address"}
                      customization={{
                        spiceLevel: spiceLevel || "medium",
                        removedIngredients:
                          removedIngredients.length > 0
                            ? removedIngredients
                            : undefined,
                        addOns:
                          selectedAddOns.length > 0 &&
                          meal.customizationOptions.addOns
                            ? meal.customizationOptions.addOns
                                .filter((addOn: { _id: string }) =>
                                  selectedAddOns.includes(addOn._id),
                                )
                                .map(
                                  (addOn: {
                                    _id: string;
                                    name: string;
                                    price: number;
                                  }) => ({
                                    name: addOn.name,
                                    price: addOn.price,
                                  }),
                                )
                            : undefined,
                        specialInstructions: noteToChef.trim() || undefined,
                      }}
                      onSuccess={() => router.push("/cart")}
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
