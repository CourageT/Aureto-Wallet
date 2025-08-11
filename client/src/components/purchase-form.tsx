import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const purchaseSchema = z.object({
  actualQuantity: z.string().min(1, "Quantity is required"),
  actualUnitPrice: z.string().min(1, "Unit price is required"),
  actualAmount: z.string().min(1, "Total amount is required"),
  notes: z.string().optional(),
});

type PurchaseFormData = z.infer<typeof purchaseSchema>;

interface PurchaseFormProps {
  item: any;
  onSubmit: (data: PurchaseFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export default function PurchaseForm({ item, onSubmit, onCancel, isLoading }: PurchaseFormProps) {
  const form = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      actualQuantity: item?.plannedQuantity?.toString() || "1",
      actualUnitPrice: item?.plannedUnitPrice?.toString() || "0",
      actualAmount: item?.plannedAmount?.toString() || "0",
      notes: "",
    },
  });

  const calculateTotal = () => {
    const quantity = parseFloat(form.getValues("actualQuantity") || "0");
    const unitPrice = parseFloat(form.getValues("actualUnitPrice") || "0");
    const total = quantity * unitPrice;
    form.setValue("actualAmount", total.toFixed(2));
  };

  if (!item) return null;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Item Info */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Item:</span>
                <span className="font-medium">{item.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Planned:</span>
                <span>
                  {item?.plannedQuantity} {item?.unit} × ${parseFloat(item?.plannedUnitPrice || "0").toFixed(2)} = ${parseFloat(item?.plannedAmount || "0").toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Purchase Details */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="actualQuantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Actual Quantity</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.1" 
                    placeholder="2.5" 
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      calculateTotal();
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="actualUnitPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Actual Unit Price</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="5.99" 
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      calculateTotal();
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="actualAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Total Amount Paid</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="14.98" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Store, special offers, etc..." 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Variance Display */}
        {(() => {
          const plannedAmount = parseFloat(item?.plannedAmount || "0");
          const actualAmount = parseFloat(form.watch("actualAmount") || "0");
          const variance = actualAmount - plannedAmount;

          if (Math.abs(variance) > 0.01) {
            return (
              <Card className={variance > 0 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
                <CardContent className="p-4">
                  <div className="text-sm">
                    <span className={variance > 0 ? "text-red-700" : "text-green-700"}>
                      {variance > 0 ? "Over budget" : "Under budget"} by ${Math.abs(variance).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          }
          return null;
        })()}

        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? "Recording..." : "Record Purchase"}
          </Button>
        </div>
      </form>
    </Form>
  );
}