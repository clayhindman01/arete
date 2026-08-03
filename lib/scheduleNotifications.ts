import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

export async function scheduleDailyNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Morning plan reminder
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Your plan awaits",
      body: "Start your day with intention.",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 8,
      minute: 0,
    },
  });

  scheduleCompletionReminder();
}

export async function scheduleCompletionReminder() {
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Finish strong",
      body: "You still have commitments left for today.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 30,
    },
  });

  await AsyncStorage.setItem("eveningReminderId", notificationId);
}

export async function cancelCompletionReminder() {
  console.log("Cancelling completion reminder");
  const notificationId = await AsyncStorage.getItem("eveningReminderId");

  if (notificationId) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);

    await AsyncStorage.removeItem("eveningReminderId");
  }
}
