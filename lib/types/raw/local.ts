/**
 * Tipos de arquivos locais (index.json e manifest.json) — não correspondem
 * a nenhum endpoint da UNIASSELVI, são metadados do catálogo local de usuários.
 */
export interface UserIndexEntry {
  id: string;
  label: string;
  isFictional: boolean;
}

export interface UserIndex {
  users: UserIndexEntry[];
  defaultUserId: string;
}

export interface UserManifest {
  userId: string;
  isFictional: boolean;
  displayLabel: string;
  scenario: string;
  scenarioCode?: string;
  simulationDate?: string;
  cohortBaseUserId?: string;
  datasets: {
    userData: boolean;
    currentSemester: boolean;
    sofiaDadosAluno: boolean;
    disciplines: boolean;
    financialTitles: boolean;
    studyActivities?: boolean;
    workSchedule?: boolean;
  };
  subjects: string[];
  screens: string[];
  notes: string;
}
