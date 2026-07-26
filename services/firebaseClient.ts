import {
  getApps,
  initializeApp,
  type FirebaseApp,
} from "firebase/app";
import {
  getAnalytics,
  isSupported,
  type Analytics,
} from "firebase/analytics";
import {
  connectAuthEmulator,
  getAuth,
  type Auth,
} from "firebase/auth";
import {
  connectFunctionsEmulator,
  getFunctions,
  type Functions,
} from "firebase/functions";
import {
  connectFirestoreEmulator,
  getFirestore,
  type Firestore,
} from "firebase/firestore";
import {
  connectStorageEmulator,
  getStorage,
  type FirebaseStorage,
} from "firebase/storage";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const ready = [
  config.apiKey,
  config.authDomain,
  config.projectId,
  config.storageBucket,
  config.messagingSenderId,
  config.appId,
].every(Boolean);

const useFirebaseEmulators =
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS ===
  "true";

let app: FirebaseApp | null = null;

interface EmulatorConnectionState {
  auth: boolean;
  firestore: boolean;
  functions: boolean;
  storage: boolean;
}

type SidraGlobalState = typeof globalThis & {
  __sidraFirebaseEmulators?: EmulatorConnectionState;
};

interface EmulatorAddress {
  readonly host: string;
  readonly port: number;
}

export interface FirebaseClientServices {
  readonly auth: Auth;
  readonly db: Firestore;
  readonly storage: FirebaseStorage;
  readonly functions: Functions;
}

function getEmulatorConnectionState(): EmulatorConnectionState {
  const state = globalThis as SidraGlobalState;

  state.__sidraFirebaseEmulators ??= {
    auth: false,
    firestore: false,
    functions: false,
    storage: false,
  };

  return state.__sidraFirebaseEmulators;
}

function parseEmulatorAddress(
  value: string | undefined,
  fallbackPort: number,
): EmulatorAddress {
  const normalized = (
    value ?? `127.0.0.1:${fallbackPort}`
  )
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  const separator = normalized.lastIndexOf(":");

  if (separator <= 0) {
    return {
      host: normalized || "127.0.0.1",
      port: fallbackPort,
    };
  }

  const host = normalized.slice(0, separator);
  const parsedPort = Number(
    normalized.slice(separator + 1),
  );

  return {
    host: host || "127.0.0.1",
    port:
      Number.isInteger(parsedPort) && parsedPort > 0
        ? parsedPort
        : fallbackPort,
  };
}

function connectFirebaseEmulators(
  services: FirebaseClientServices,
): void {
  if (!useFirebaseEmulators) {
    return;
  }

  const state = getEmulatorConnectionState();

  const authAddress = parseEmulatorAddress(
    process.env
      .NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST,
    9099,
  );

  const firestoreAddress = parseEmulatorAddress(
    process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST,
    8080,
  );

  const functionsAddress = parseEmulatorAddress(
    process.env
      .NEXT_PUBLIC_FIREBASE_FUNCTIONS_EMULATOR_HOST,
    5001,
  );

  const storageAddress = parseEmulatorAddress(
    process.env
      .NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST,
    9199,
  );

  if (!state.auth) {
    connectAuthEmulator(
      services.auth,
      `http://${authAddress.host}:${authAddress.port}`,
      {
        disableWarnings: true,
      },
    );

    state.auth = true;
  }

  if (!state.firestore) {
    connectFirestoreEmulator(
      services.db,
      firestoreAddress.host,
      firestoreAddress.port,
    );

    state.firestore = true;
  }

  if (!state.functions) {
    connectFunctionsEmulator(
      services.functions,
      functionsAddress.host,
      functionsAddress.port,
    );

    state.functions = true;
  }

  if (!state.storage) {
    connectStorageEmulator(
      services.storage,
      storageAddress.host,
      storageAddress.port,
    );

    state.storage = true;
  }
}

export function getFirebaseApp(): FirebaseApp | null {
  if (!ready) {
    return null;
  }

  app ??= getApps()[0] ?? initializeApp(config);

  return app;
}

export function getFirebaseServices():
  | FirebaseClientServices
  | null {
  const firebaseApp = getFirebaseApp();

  if (!firebaseApp) {
    return null;
  }

  const services: FirebaseClientServices = {
    auth: getAuth(firebaseApp),
    db: getFirestore(firebaseApp),
    storage: getStorage(firebaseApp),
    functions: getFunctions(firebaseApp),
  };

  connectFirebaseEmulators(services);

  return services;
}

export function requireFirebaseServices():
  FirebaseClientServices {
  const services = getFirebaseServices();

  if (!services) {
    throw new Error(
      "Sidra is not connected to Firebase. Add the required environment variables.",
    );
  }

  return services;
}

export async function getFirebaseAnalytics():
  Promise<Analytics | null> {
  const firebaseApp = getFirebaseApp();

  if (
    !firebaseApp ||
    typeof window === "undefined" ||
    !(await isSupported())
  ) {
    return null;
  }

  return getAnalytics(firebaseApp);
}
