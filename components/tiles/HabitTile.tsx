import { getCalendar } from "@/lib/db";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Card from "../ui/Card";

export default function HabitTile({
  refreshKey,
  statusOverrides,
}: {
  refreshKey?: number;
  statusOverrides?: Record<string, string>;
}) {
  const { colors } = useTheme();

  const days = ["S", "M", "T", "W", "T", "F", "S"];
  const monthMap = new Map([
    [0, "January"],
    [1, "February"],
    [2, "March"],
    [3, "April"],
    [4, "May"],
    [5, "June"],
    [6, "July"],
    [7, "August"],
    [8, "September"],
    [9, "October"],
    [10, "November"],
    [11, "December"],
  ]);

  const [viewDate, setViewDate] = useState(() => new Date());
  const [calendarData, setCalendarData] = useState<
    Array<{ day?: string; date?: string; status?: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMonthKey, setActiveMonthKey] = useState("");
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const mergeStatusOverrides = (
    items: Array<{ day?: string; date?: string; status?: string }>,
  ) => {
    if (!statusOverrides || Object.keys(statusOverrides).length === 0) {
      return items;
    }

    return items.map((entry) => {
      const rawDate = entry.day ?? entry.date;
      const normalizedDate =
        typeof rawDate === "string"
          ? rawDate.includes("T")
            ? rawDate.split("T")[0]
            : rawDate
          : "";

      if (!normalizedDate || !statusOverrides[normalizedDate]) {
        return entry;
      }

      return {
        ...entry,
        status: statusOverrides[normalizedDate],
      };
    });
  };

  const month = viewDate.getMonth();
  const year = viewDate.getFullYear();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayIndex = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();
  const leadingEmptyDays = firstDayIndex;
  const totalCells = leadingEmptyDays + daysInMonth;
  const trailingEmptyDays = (7 - (totalCells % 7)) % 7;

  const dayStatusMap = new Map(
    calendarData.map((entry) => {
      const rawDate = entry.day ?? entry.date;
      const normalizedDate =
        typeof rawDate === "string"
          ? rawDate.includes("T")
            ? rawDate.split("T")[0]
            : rawDate
          : "";
      const normalizedStatus =
        typeof entry.status === "string" ? entry.status.toLowerCase() : "none";

      return [normalizedDate, normalizedStatus];
    }),
  );

  const calendarDays = Array.from(
    { length: leadingEmptyDays + daysInMonth + trailingEmptyDays },
    (_, index) => {
      const dayNumber = index - leadingEmptyDays + 1;

      if (dayNumber <= 0 || dayNumber > daysInMonth) {
        return null;
      }

      const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
      const status = dayStatusMap.get(dateKey) ?? "none";

      return {
        day: dayNumber,
        status,
      };
    },
  );

  const weeks = Array.from(
    { length: Math.ceil(calendarDays.length / 7) },
    (_, index) => calendarDays.slice(index * 7, index * 7 + 7),
  );

  const goToPreviousMonth = () => {
    setViewDate(
      (currentDate) =>
        new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const goToNextMonth = () => {
    setViewDate(
      (currentDate) =>
        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  useEffect(() => {
    const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
    const isMonthChange = activeMonthKey !== "" && activeMonthKey !== monthKey;

    if (!isInitialLoad && !isMonthChange) {
      return;
    }

    setIsLoading(true);

    let isActive = true;

    const loadCalendar = async () => {
      try {
        const res = await getCalendar(firstDayOfMonth);
        console.log("Calendar data fetched:", res);
        if (isActive) {
          setCalendarData(mergeStatusOverrides(Array.isArray(res) ? res : []));
          setIsLoading(false);
          setActiveMonthKey(monthKey);
          setIsInitialLoad(false);
        }
      } catch (error) {
        console.error("Failed to load calendar data", error);
        if (isActive) {
          setCalendarData([]);
          setIsLoading(false);
          setActiveMonthKey(monthKey);
          setIsInitialLoad(false);
        }
      }
    };

    loadCalendar();

    return () => {
      isActive = false;
    };
  }, [
    month,
    year,
    firstDayOfMonth,
    isInitialLoad,
    activeMonthKey,
    statusOverrides,
  ]);

  useEffect(() => {
    if (
      !refreshKey ||
      !statusOverrides ||
      Object.keys(statusOverrides).length === 0
    ) {
      return;
    }

    setCalendarData((previousData) => mergeStatusOverrides(previousData));
  }, [refreshKey, statusOverrides]);

  if (isLoading && isInitialLoad) {
    return (
      <Card style={styles.container}>
        <ActivityIndicator />
      </Card>
    );
  }

  return (
    <Card style={styles.container}>
      <Pressable style={styles.navigationChevron} onPress={goToPreviousMonth}>
        <MaterialCommunityIcons
          name="chevron-left"
          size={50}
          color={colors.text}
        />
      </Pressable>
      <View>
        <View>
          <Text style={styles.titleText}>
            {`${monthMap.get(month)?.toUpperCase()} ${year.toString()}`}
          </Text>
        </View>
        <View style={styles.headerContainer}>
          {days.map((day, index) => (
            <DayText day={day} key={index} />
          ))}
        </View>
        {weeks.map((week, weekIndex) => (
          <View style={styles.headerContainer} key={weekIndex}>
            {week.map((day, dayIndex) => (
              <HabitBox
                key={`${weekIndex}-${dayIndex}`}
                day={day?.day ?? null}
                status={day?.status}
              />
            ))}
          </View>
        ))}
      </View>
      <Pressable style={styles.navigationChevron} onPress={goToNextMonth}>
        <MaterialCommunityIcons
          name="chevron-right"
          size={50}
          color={colors.text}
        />
      </Pressable>
    </Card>
  );
}

const DayText = ({ day }: { day: string }) => {
  return (
    <View style={{ width: 25, alignItems: "center" }}>
      <Text style={{ color: "#A1A1AA", textAlign: "center" }}>{day}</Text>
    </View>
  );
};

const HabitBox = ({
  day,
  status = "none",
}: {
  day?: number | null;
  status?: string;
}) => {
  const isVisibleDay = day !== null && day !== undefined;
  const isComplete = status === "complete";
  const isPartial = status === "partial";

  return (
    <View
      style={[
        styles.habitBox,
        isVisibleDay && styles.dayVisible,
        isVisibleDay && isComplete && styles.complete,
        isVisibleDay && isPartial && styles.partial,
      ]}
    >
      {isVisibleDay ? (
        <Text
          style={[
            styles.dayText,
            isComplete && styles.darkText,
            isPartial && styles.darkText,
          ]}
        >
          {day}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    minHeight: 200,
  },
  titleText: {
    fontSize: 14,
    fontWeight: 600,
    paddingBottom: 5,
    letterSpacing: 1,
    color: "#A1A1AA",
    textAlign: "center",
  },
  headerContainer: {
    gap: 3,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 3,
  },
  habitBox: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: 25,
    width: 25,
    borderRadius: 3,
  },
  dayVisible: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#A1A1AA",
  },
  complete: {
    backgroundColor: "rgba(34, 197, 94, 0.7)",
    borderColor: "#111318",
  },
  partial: {
    backgroundColor: "#b89b5e",
    borderColor: "#111318",
  },
  dayText: {
    color: "#A1A1AA",
    fontSize: 10,
    fontWeight: "600",
  },
  darkText: {
    color: "#111318",
  },
  navigationChevron: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 25,
  },
});
