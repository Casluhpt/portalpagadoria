import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { 
  processEntrarFila, 
  processSairFila, 
  processGetFilaStatus, 
  processHeartbeatFila 
} from "./concorrencia.server";

export const entrarFila = createServerFn({ method: "POST" })
  .validator((data) => z.object({
    userId: z.string(),
    userNome: z.string(),
    modulo: z.string(),
    sessionId: z.string().optional(),
  }).parse(data))
  .handler(async ({ data }) => {
    return processEntrarFila(data);
  });

export const sairFila = createServerFn({ method: "POST" })
  .validator((data) => z.object({
    userId: z.string(),
    modulo: z.string(),
  }).parse(data))
  .handler(async ({ data }) => {
    return processSairFila(data);
  });

export const getFilaStatus = createServerFn({ method: "GET" })
  .validator((data) => z.object({
    modulo: z.string(),
  }).parse(data))
  .handler(async ({ data }) => {
    return processGetFilaStatus(data.modulo);
  });

export const heartbeatFila = createServerFn({ method: "POST" })
  .validator((data) => z.object({
    userId: z.string(),
    modulo: z.string(),
    sessionId: z.string().optional(),
  }).parse(data))
  .handler(async ({ data }) => {
    return processHeartbeatFila(data);
  });
