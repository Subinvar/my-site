import { Alert } from "@/components/alert";
import { Callout, type CalloutLabels } from "@/components/callout";
import { Figure } from "@/components/figure";

export function createMarkdocComponents(labels?: CalloutLabels | null) {
  const resolvedLabels: CalloutLabels = {
    title: labels?.title ?? null,
    note: labels?.note ?? null,
    info: labels?.info ?? null,
    warning: labels?.warning ?? null,
    success: labels?.success ?? null,
  };

  return {
    Callout: (props: Parameters<typeof Callout>[0]) => <Callout {...props} labels={resolvedLabels} />,
    Alert,
    Figure,
  };
}