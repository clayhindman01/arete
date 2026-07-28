import { Text, View } from "react-native";

export const handleError = (error: ErrorType) => {
  return {
    error: error.error,
    message: error.message,
  } as ErrorType;
};

export interface ErrorType {
  error: string;
  message: string;
}

export const ErrorComponent = ({ label }: { label: string }) => {
  return (
    <View
      style={{
        backgroundColor: "#cb4d4d",
        marginVertical: 10,
        padding: 14,
        borderRadius: 10,
        alignItems: "center",
      }}
    >
      <Text>{label}</Text>
    </View>
  );
};
