import postgres from 'postgres';
import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rooms = await sql`
      SELECT id, room_name, created_at
      FROM users.rooms
      ORDER BY room_name
    `;

    return Response.json(rooms);
  } catch (error) {
    console.error('Failed to fetch rooms:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { room_name } = await req.json();

    if (!room_name) {
      return Response.json({ 
        error: 'Room name is required' 
      }, { status: 400 });
    }

    const newRoom = await sql`
      INSERT INTO users.rooms (room_name)
      VALUES (${room_name})
      RETURNING id, room_name, created_at
    `;

    return Response.json(newRoom[0], { status: 201 });
  } catch (error) {
    console.error('Failed to create room:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'Room ID is required' }, { status: 400 });
    }

    const deletedRoom = await sql`
      DELETE FROM users.rooms
      WHERE id = ${Number(id)}
      RETURNING id, room_name
    `;

    if (deletedRoom.length === 0) {
      return Response.json({ error: 'Room not found' }, { status: 404 });
    }

    return Response.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Failed to delete room:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, room_name } = await req.json();

    if (!id || !room_name) {
      return Response.json({ 
        error: 'Room ID and name are required' 
      }, { status: 400 });
    }

    const updatedRoom = await sql`
      UPDATE users.rooms
      SET room_name = ${room_name}
      WHERE id = ${Number(id)}
      RETURNING id, room_name, created_at
    `;

    if (updatedRoom.length === 0) {
      return Response.json({ error: 'Room not found' }, { status: 404 });
    }

    return Response.json(updatedRoom[0]);
  } catch (error) {
    console.error('Failed to update room:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
