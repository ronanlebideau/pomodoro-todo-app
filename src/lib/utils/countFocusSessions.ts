import { db } from '$lib/db';

/**
 * Compte le nombre de sessions de focus pour une tâche spécifique
 */
export async function countFocusSessions(taskId: number): Promise<number> {
    try {
        const sessions = await db.getPomodoroSessions();
        return sessions.filter(session => 
            session.taskId === taskId && 
            session.type === 'focus' && 
            session.completed === true
        ).length;
    } catch (error) {
        console.error('Error counting focus sessions:', error);
        return 0;
    }
}

/**
 * Récupère un objet avec les IDs de tâches comme clés et le nombre de sessions comme valeurs
 */
export async function getFocusSessionsByTask(): Promise<Record<number, number>> {
    try {
        const sessions = await db.getPomodoroSessions();
        const result: Record<number, number> = {};
        
        sessions.forEach(session => {
            if (session.taskId && session.type === 'focus' && session.completed) {
                result[session.taskId] = (result[session.taskId] || 0) + 1;
            }
        });
        
        return result;
    } catch (error) {
        console.error('Error getting focus sessions by task:', error);
        return {};
    }
}
