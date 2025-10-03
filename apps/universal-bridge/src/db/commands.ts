/**
 * Commands Database Functions
 * 
 * IoT 명령 관련 DB 작업
 */

import { getSupabase } from './client.js';

export interface Command {
  id?: string;
  device_id: string;
  command_id: string;
  type: string;
  params: any;
  status: 'pending' | 'sent' | 'acknowledged' | 'failed';
  created_at?: string;
  sent_at?: string;
  ack_timestamp?: string;
  ack_payload?: any;
}

/**
 * 디바이스에 명령 추가
 */
export async function insertCommand(command: Omit<Command, 'id' | 'created_at'>): Promise<Command> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('iot_commands')
    .insert({
      device_id: command.device_id,
      command_id: command.command_id,
      type: command.type,
      params: command.params,
      status: command.status,
      sent_at: command.sent_at,
      ack_timestamp: command.ack_timestamp,
      ack_payload: command.ack_payload
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to insert command: ${error.message}`);
  }

  return data;
}

/**
 * 대기 중인 명령 조회
 */
export async function getPendingCommands(deviceId: string): Promise<Command[]> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('iot_commands')
    .select('*')
    .eq('device_id', deviceId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to get pending commands: ${error.message}`);
  }

  return data || [];
}

/**
 * 명령 상태 업데이트
 */
export async function updateCommandStatus(
  commandId: string, 
  status: Command['status'],
  ackPayload?: any
): Promise<void> {
  const supabase = getSupabase();
  
  const updateData: any = {
    status,
    updated_at: new Date().toISOString()
  };

  if (ackPayload) {
    updateData.ack_payload = ackPayload;
    updateData.ack_timestamp = new Date().toISOString();
  }

  const { error } = await supabase
    .from('iot_commands')
    .update(updateData)
    .eq('command_id', commandId);

  if (error) {
    throw new Error(`Failed to update command status: ${error.message}`);
  }
}
