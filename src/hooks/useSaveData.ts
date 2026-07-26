import { useEffect, useState } from "react";

interface NetworkInformationLike extends EventTarget {
  readonly saveData?: boolean;
}

type NavigatorWithConnection = Navigator & {
  readonly connection?: NetworkInformationLike;
};

function getConnection() {
  if (typeof navigator === "undefined") return undefined;
  return (navigator as NavigatorWithConnection).connection;
}

function getSaveDataPreference() {
  return getConnection()?.saveData === true;
}

export function useSaveData() {
  const [saveData, setSaveData] = useState(getSaveDataPreference);

  useEffect(() => {
    const connection = getConnection();
    if (!connection) return;

    const update = () => setSaveData(connection.saveData === true);
    update();
    connection.addEventListener("change", update);
    return () => connection.removeEventListener("change", update);
  }, []);

  return saveData;
}
