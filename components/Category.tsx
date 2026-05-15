import { CircleDollarSign, CreditCard, Landmark, WalletCards } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { formatAmount } from "@/lib/utilsz";

const categoryStyles = [
  {
    icon: CircleDollarSign,
    iconBg: "bg-blue-100",
    iconText: "text-blue-700",
    progress: "bg-blue-600",
  },
  {
    icon: CreditCard,
    iconBg: "bg-emerald-100",
    iconText: "text-emerald-700",
    progress: "bg-emerald-600",
  },
  {
    icon: WalletCards,
    iconBg: "bg-amber-100",
    iconText: "text-amber-700",
    progress: "bg-amber-500",
  },
  {
    icon: Landmark,
    iconBg: "bg-pink-100",
    iconText: "text-pink-700",
    progress: "bg-pink-600",
  },
];

const Category = ({ category, index }: CategoryProps) => {
  const styles = categoryStyles[index % categoryStyles.length];
  const Icon = styles.icon;

  return (
    <div className="category">
      <div className="category-details">
        <div className={`category-icon ${styles.iconBg}`}>
          <Icon className={`size-5 ${styles.iconText}`} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-14 font-semibold capitalize text-gray-900">
              {category.name}
            </p>
            <p className="text-14 font-semibold text-gray-700">
              {category.percentage}%
            </p>
          </div>

          <p className="text-12 text-gray-500">
            {formatAmount(category.totalAmount)} spent
          </p>
        </div>
      </div>

      <Progress
        value={category.percentage}
        className="h-2 bg-gray-100"
        indicatorClassName={styles.progress}
      />
    </div>
  );
};

export default Category;
