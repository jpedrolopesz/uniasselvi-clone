import type { ExamCityComparison } from "@/lib/types/derived";

export function CityComparisonNotice({ comparison }: { comparison: ExamCityComparison }) {
  if (!comparison.studentCity || !comparison.studentState) {
    return (
      <p className="rounded-lg bg-bg-card p-3 text-xs text-text-secondary">
        Cadastre sua cidade para comparar com o local da prova e encontrar colegas que também
        precisarão se deslocar.
      </p>
    );
  }

  if (!comparison.examCity || !comparison.examState) {
    return (
      <p className="rounded-lg bg-bg-card p-3 text-xs text-text-secondary">
        Esta prova ainda não tem uma cidade de realização cadastrada.
      </p>
    );
  }

  if (comparison.isSameCity) {
    return (
      <p className="rounded-lg bg-bg-card p-3 text-sm text-white">
        A prova será realizada na sua cidade, {comparison.examCity}/{comparison.examState}.
      </p>
    );
  }

  return (
    <p className="rounded-lg bg-accent-orange/10 p-3 text-sm text-white">
      Você fará a prova em {comparison.examCity}/{comparison.examState}, mas seu endereço
      cadastrado está em {comparison.studentCity}/{comparison.studentState}. Organize seu
      deslocamento com antecedência.
    </p>
  );
}
