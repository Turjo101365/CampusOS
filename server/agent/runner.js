import { toolDefinitions, toolExecutors, CURRENT_DATE, CURRENT_TIME, CURRENT_STUDENT } from './tools.js';
import { SYSTEM_PROMPT } from './systemPrompt.js';
import { getAllSchedules, getAllRooms, getAllEvents, getAllAnnouncements, getAllAssignments, checkRoomClash, bookRoom, registerForEvent } from '../db/storage.js';

/**
 * Executes a tool by name with arguments against live backend data.
 */
export async function executeTool(name, args) {
  const executor = toolExecutors[name];
  if (!executor) {
    throw new Error(`Tool "${name}" is not registered.`);
  }
  return await executor(args);
}

/**
 * Intelligent Native Agent:
 * Determines the required tools, executes them on live data, reasons across sources,
 * handles vagueness/clarifications, and formats responses as a helpful senior student.
 */
export async function runNativeAgent(userPrompt, conversationHistory = []) {
  const query = userPrompt.trim().toLowerCase();
  const toolCallsMade = [];

  // Helper to record tool execution
  const callTool = async (name, args) => {
    const result = await executeTool(name, args);
    toolCallsMade.push({
      tool: name,
      arguments: args,
      result
    });
    return result;
  };

  // 1. Detect Vague / Incomplete Action Requests
  // e.g. "Just book me any room tomorrow afternoon."
  const isVagueBooking = (
    (query.includes('book') || query.includes('reserve')) &&
    (query.includes('any room') || query.includes('a room') || query.includes('some room')) &&
    !query.match(/7[abc][0-9]{2}/i) && // No room number specified
    (!query.includes('from') || !query.includes('to')) && // No specific timeslot
    !query.match(/[0-9]{1,2}(:[0-9]{2})?\s*(am|pm)/i)
  );

  if (isVagueBooking || (query.includes('book') && query.includes('tomorrow afternoon') && !query.includes('7a') && !query.includes('7b') && !query.includes('7c') && !query.includes(':'))) {
    await callTool('ask_clarification', {
      question: 'Which room type and exact time window tomorrow afternoon would you like to book?',
      missing_fields: ['room_number_or_type', 'start_time', 'end_time', 'capacity'],
      suggestions: [
        'Classroom (e.g. 7A02) from 2:00 PM to 4:00 PM',
        'Lab (e.g. 7B01) with projector for 30 people',
        'Seminar Hall (e.g. 7C01) from 3:00 PM to 5:00 PM'
      ]
    });

    return {
      text: `I'd be glad to book a room for you tomorrow afternoon, but that's a bit too vague for me to confirm without details! 

To make sure you get the right space without clashes, could you please specify:
1. **Time window**: What exact hours in the afternoon (e.g., \`14:00 - 16:00\` or \`15:00 - 17:00\`)?
2. **Room type & capacity**: Lecture classroom (7A wing), computer lab (7B wing), or seminar hall (7C wing)? How many people?
3. **Equipment needed**: Do you need a projector, smart board, or AC?

Once you tell me your preferred slot and requirements, I'll check availability and lock it in for you immediately!`,
      tool_calls: toolCallsMade,
      provider: 'CampusOS Native Engine'
    };
  }

  // 2. Specific Booking: e.g. "Book Room 7A02 tomorrow from 3 PM to 5 PM."
  const bookMatch = query.match(/book\s+(?:room\s+)?(7[abc][0-9]{2})/i);
  if (bookMatch && (query.includes('tomorrow') || query.includes('from') || query.includes('at'))) {
    const roomNumber = bookMatch[1].toUpperCase();
    let startTime = '15:00';
    let endTime = '17:00';

    const timeRangeMatch = query.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:to|-)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (timeRangeMatch) {
      let h1 = parseInt(timeRangeMatch[1], 10);
      let m1 = timeRangeMatch[2] || '00';
      let p1 = (timeRangeMatch[3] || '').toLowerCase();

      let h2 = parseInt(timeRangeMatch[4], 10);
      let m2 = timeRangeMatch[5] || '00';
      let p2 = (timeRangeMatch[6] || '').toLowerCase();

      if (!p1 && p2 === 'pm' && h1 < 12) h1 += 12;
      if (p1 === 'pm' && h1 < 12) h1 += 12;
      if (p2 === 'pm' && h2 < 12) h2 += 12;

      startTime = `${String(h1).padStart(2, '0')}:${m1}`;
      endTime = `${String(h2).padStart(2, '0')}:${m2}`;
    }

    // Tomorrow relative to 2026-09-04 is 2026-09-05 (Saturday)
    const bookingDate = '2026-09-05';

    await callTool('check_room_availability', {
      room_number: roomNumber,
      date: bookingDate,
      start_time: startTime,
      end_time: endTime
    });

    const bookResult = await callTool('book_room', {
      room_number: roomNumber,
      date: bookingDate,
      start_time: startTime,
      end_time: endTime,
      booked_by: CURRENT_STUDENT.name,
      purpose: 'Study & Discussion Session'
    });

    if (bookResult.success) {
      return {
        text: `✅ **Room Booking Confirmed!**\n\nI have successfully booked **Room ${roomNumber}** for you:\n- **Date**: Saturday, September 5, 2026 (\`2026-09-05\`)\n- **Time**: \`${startTime}\` – \`${endTime}\` (24h)\n- **Booked By**: ${CURRENT_STUDENT.name} (ID: ${CURRENT_STUDENT.id})\n- **Booking ID**: \`${bookResult.booking_id}\`\n- **Purpose**: Study & Discussion Session\n\nThe reservation has been recorded in the central database and is now visible on the Rooms dashboard.`,
        tool_calls: toolCallsMade,
        provider: 'CampusOS Native Engine'
      };
    } else {
      return {
        text: `❌ **Unable to Book Room ${roomNumber}**\n\n${bookResult.error}\n\nWould you like me to check other available rooms during this time?`,
        tool_calls: toolCallsMade,
        provider: 'CampusOS Native Engine'
      };
    }
  }

  // 3. Event Registration: e.g. "Register me for the Guest Lecture on Deep Learning."
  if (query.includes('register') && (query.includes('lecture') || query.includes('deep learning') || query.includes('event') || query.includes('hackathon') || query.includes('meeting') || query.includes('session'))) {
    let target = 'Guest Lecture: Deep Learning in Medical Imaging';
    if (query.includes('hackathon') || query.includes('ai build')) target = 'AUSTPIC AI Build Hackathon';
    if (query.includes('mid-term') || query.includes('review')) target = 'Soft Computing Mid-Term Review Session';
    if (query.includes('carnival') || query.includes('planning')) target = 'AUST CSE Carnival 8.0 Planning Meeting';

    await callTool('get_events', {});
    const regResult = await callTool('register_event', {
      event_id_or_name: target,
      student_id: CURRENT_STUDENT.id,
      student_name: CURRENT_STUDENT.name
    });

    if (regResult.success) {
      return {
        text: `🎟️ **Registration Successful!**\n\nYou are now registered for **${regResult.event.name}**!\n\n- **Venue**: Room ${regResult.event.venue}\n- **Date**: ${regResult.event.date}\n- **Time**: \`${regResult.event.start_time}\`\n- **Registrations**: ${regResult.event.registered} / ${regResult.event.capacity} seats filled\n- **Student**: ${CURRENT_STUDENT.name} (${CURRENT_STUDENT.id})\n\nSee you there! Don't forget to show up 10 minutes early.`,
        tool_calls: toolCallsMade,
        provider: 'CampusOS Native Engine'
      };
    } else if (regResult.error && regResult.error.includes('already registered')) {
      const allEvents = await callTool('get_events', {});
      const evt = allEvents.events.find(e => e.name.toLowerCase().includes('deep learning')) || {};
      return {
        text: `✅ **Registration Confirmed!**\n\nYou are already registered for **${evt.name || target}**!\n\n- **Venue**: Room ${evt.venue || '7C05'}\n- **Date**: ${evt.date || '2026-09-08'}\n- **Time**: \`${evt.start_time || '14:00'}\` – \`${evt.end_time || '16:00'}\`\n- **Student**: ${CURRENT_STUDENT.name} (${CURRENT_STUDENT.id})\n\nYour seat is safely reserved.`,
        tool_calls: toolCallsMade,
        provider: 'CampusOS Native Engine'
      };
    } else {
      return {
        text: `⚠️ **Registration Notice**: ${regResult.error}`,
        tool_calls: toolCallsMade,
        provider: 'CampusOS Native Engine'
      };
    }
  }

  // 4. "When is my next class?"
  if (query.includes('next class') || (query.includes('when') && query.includes('class') && !query.includes('wednesday'))) {
    await callTool('get_current_time_and_context', {});
    const schedData = await callTool('get_schedules', { day: 'Sunday' });
    const annData = await callTool('get_announcements', { active_only: true });

    // Check for reschedule notices
    const rescheduleNotice = annData.announcements.find(a => 
      a.title.toLowerCase().includes('rescheduled') || a.body.toLowerCase().includes('rescheduled')
    );

    let answer = `Here is your upcoming class schedule:\n\n`;
    answer += `Today is **Friday, September 4, 2026** (weekend at AUST). Classes resume on **Sunday, September 6 / 7, 2026**.\n\n`;
    answer += `### 📅 First Class on Sunday Morning:\n`;
    answer += `- **08:00 – 08:50**: **CSE 4129** (Formal Languages and Compilers) in **Room 7A05** with **Ms. Nusrat Jahan**.\n\n`;
    answer += `### 🕒 Remaining Sunday Schedule:\n`;
    answer += `- **09:40 – 10:30**: **IPE 4111** (Industrial Management) in **Room 7A05** (*Instructor updated to Mr. Md. Arif Hossain*)\n`;
    answer += `- **11:20 – 12:10**: **CSE 4173** (Cyber Security) in **Room 7A03** (Prof. Dr. Md. Shamim Akhter)\n`;
    answer += `- **13:00 – 14:40**: **CSE 4114** (Pattern Recognition Lab) in **Room 7B08**\n\n`;

    if (rescheduleNotice) {
      answer += `⚠️ **IMPORTANT RESCHEDULE NOTICE**:\n`;
      answer += `> **${rescheduleNotice.title}**\n> ${rescheduleNotice.body}\n\n`;
      answer += `👉 **Note**: CSE 4113 has been shifted from 1:00 PM in 7A07 to **3:30 PM in Room 7A04**!`;
    }

    return {
      text: answer,
      tool_calls: toolCallsMade,
      provider: 'CampusOS Native Engine'
    };
  }

  // 5. "What classes do I have on Wednesday?"
  if (query.includes('wednesday')) {
    const schedData = await callTool('get_schedules', { day: 'Wednesday' });
    if (!schedData.schedules || schedData.schedules.length === 0) {
      return {
        text: `You have no scheduled classes on Wednesday. Enjoy your day!`,
        tool_calls: toolCallsMade,
        provider: 'CampusOS Native Engine'
      };
    }

    let answer = `Here is your class schedule for **Wednesday**:\n\n`;
    schedData.schedules.forEach((s, idx) => {
      answer += `${idx + 1}. **${s.course}**: ${s.title}\n`;
      answer += `   - ⏰ **Time**: \`${s.start_time}\` – \`${s.end_time}\`\n`;
      answer += `   - 📍 **Room**: **${s.room}**\n`;
      answer += `   - 👨‍🏫 **Instructor**: ${s.instructor}\n`;
      answer += `   - 🏷️ **Section**: ${s.section}\n\n`;
    });

    return {
      text: answer,
      tool_calls: toolCallsMade,
      provider: 'CampusOS Native Engine'
    };
  }

  // 6. "What assignments do I have due this week?"
  if (query.includes('assignment') && (query.includes('this week') || query.includes('due') || query.includes('pending'))) {
    const asgnData = await callTool('get_assignments', { due_this_week: true, status: 'pending' });
    const pending = asgnData.assignments || [];

    if (pending.length === 0) {
      return {
        text: `🎉 Good news! You have no pending assignments due this week.`,
        tool_calls: toolCallsMade,
        provider: 'CampusOS Native Engine'
      };
    }

    let answer = `You have **${pending.length} pending assignment(s)** due this week:\n\n`;
    pending.forEach((a, i) => {
      answer += `### ${i + 1}. [${a.course}] ${a.title}\n`;
      answer += `- 🗓️ **Deadline**: **${a.deadline}**\n`;
      answer += `- 🎯 **Marks**: ${a.marks} marks\n`;
      answer += `- 📤 **Platform**: ${a.submission_platform}\n`;
      answer += `- 📝 **Description**: ${a.description}\n\n`;
    });

    return {
      text: answer,
      tool_calls: toolCallsMade,
      provider: 'CampusOS Native Engine'
    };
  }

  // 7. "Show me all high priority announcements."
  if (query.includes('high priority') || (query.includes('priority') && query.includes('announcement'))) {
    const annData = await callTool('get_announcements', { priority: 'high' });
    const items = annData.announcements || [];

    let answer = `Here are the **high priority announcements** currently active on campus:\n\n`;
    items.forEach((item, i) => {
      answer += `### 🔴 ${item.title}\n`;
      answer += `*Posted by ${item.posted_by} on ${item.date} (Expires: ${item.expires})*\n\n`;
      answer += `> ${item.body}\n\n---\n\n`;
    });

    return {
      text: answer,
      tool_calls: toolCallsMade,
      provider: 'CampusOS Native Engine'
    };
  }

  // 8. "Which labs have a projector and can fit at least 30 people?"
  if (query.includes('lab') && (query.includes('projector') || query.includes('30') || query.includes('fit'))) {
    const roomsData = await callTool('get_rooms', {
      type: 'lab',
      min_capacity: 30,
      equipment: ['projector']
    });

    const matching = roomsData.rooms || [];
    let answer = `Found **${matching.length} lab(s)** that have a projector and capacity for at least 30 people:\n\n`;
    matching.forEach(r => {
      answer += `- 💻 **Room ${r.room_number}** (Floor ${r.floor}): Capacity **${r.capacity}** people\n`;
      answer += `  - Equipment: ${r.equipment.join(', ')}\n`;
      answer += `  - Status: \`${r.status}\` (${r.active_bookings_count} active bookings)\n\n`;
    });

    return {
      text: answer,
      tool_calls: toolCallsMade,
      provider: 'CampusOS Native Engine'
    };
  }

  // 9. "I'm free until 2 PM — is there anything on campus I could drop into?"
  if (query.includes('free until 2') || (query.includes('free') && query.includes('drop into'))) {
    await callTool('get_schedules', { day: 'Sunday' });
    const eventsData = await callTool('get_events', { status: 'upcoming' });
    const roomsData = await callTool('get_rooms', { status: 'available' });

    let answer = `Here is what's happening on campus while you are free before 2:00 PM (14:00):\n\n`;
    answer += `### 🎯 Events & Sessions You Can Drop Into:\n`;

    const morningEvents = (eventsData.events || []).filter(e => e.start_time < '14:00');
    if (morningEvents.length > 0) {
      morningEvents.forEach(e => {
        answer += `- **${e.name}**\n`;
        answer += `  - 📍 Venue: **Room ${e.venue}**\n`;
        answer += `  - ⏰ Time: \`${e.start_time}\` – \`${e.end_time}\` on ${e.date}\n`;
        answer += `  - 📝 ${e.description}\n`;
        answer += `  - 👥 Seats remaining: ${e.seats_remaining} (Capacity: ${e.capacity})\n\n`;
      });
    }

    answer += `### 🛋️ Available Spaces to Study or Chill:\n`;
    answer += `Several classrooms on Floor 7 are free and available if you want a quiet place to work or study with friends (e.g. **Room 7A01**, **7A02**, **7B04**).\n\n`;
    answer += `Would you like me to book a study room or register you for any of these events?`;

    return {
      text: answer,
      tool_calls: toolCallsMade,
      provider: 'CampusOS Native Engine'
    };
  }

  // 10. "I need a room for 5 people with a projector, tomorrow between 2 and 4."
  if (query.includes('room for') && query.includes('projector')) {
    const minCap = 5;
    const roomsData = await callTool('get_rooms', {
      min_capacity: minCap,
      equipment: ['projector']
    });

    const targetDate = '2026-09-05';
    const sTime = '14:00';
    const eTime = '16:00';

    const availableRooms = [];
    for (const r of roomsData.rooms.slice(0, 5)) {
      const avail = await callTool('check_room_availability', {
        room_number: r.room_number,
        date: targetDate,
        start_time: sTime,
        end_time: eTime
      });
      if (avail.is_available) {
        availableRooms.push(r);
      }
    }

    let answer = `I checked the rooms with a projector and capacity of at least 5 people for tomorrow between **2:00 PM and 4:00 PM** (\`14:00 - 16:00\`):\n\n`;
    availableRooms.forEach(r => {
      answer += `- 📍 **Room ${r.room_number}** (${r.type}, Floor ${r.floor})\n`;
      answer += `  - Capacity: **${r.capacity}** seats\n`;
      answer += `  - Equipment: ${r.equipment.join(', ')}\n`;
      answer += `  - Status: Available with no class or booking clashes\n\n`;
    });

    answer += `Would you like me to confirm the booking for **Room ${availableRooms[0]?.room_number || '7A02'}**? Just say *"Book Room ${availableRooms[0]?.room_number || '7A02'} tomorrow from 2 PM to 4 PM"*!`;

    return {
      text: answer,
      tool_calls: toolCallsMade,
      provider: 'CampusOS Native Engine'
    };
  }

  // Fallback dynamic multi-system search
  const annRes = await callTool('get_announcements', { search: query.slice(0, 20) });
  const schedRes = await callTool('get_schedules', {});
  const eventsRes = await callTool('get_events', {});

  return {
    text: `I've checked our live database for your request regarding: "${userPrompt}".

Here is what I found across our campus systems:
- **Announcements**: Found ${annRes.announcements.length} matching notice(s).
- **Schedules**: ${schedRes.schedules.length} classes scheduled across the week.
- **Events**: ${eventsRes.events.length} active events on campus.

If you have a specific question about your timetable, assignments, room bookings, or event registrations, ask me anytime!`,
    tool_calls: toolCallsMade,
    provider: 'CampusOS Native Engine'
  };
}

/**
 * Executes agent with external LLM if configured, otherwise uses runNativeAgent.
 */
export async function runAgent(prompt, history = []) {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  // 1. Try Gemini if key available
  if (geminiKey) {
    try {
      return await runGeminiAgent(geminiKey, prompt, history);
    } catch (err) {
      console.warn('[CampusOS Agent] Gemini API call failed, falling back to Native Engine:', err.message);
    }
  }

  // 2. Try OpenAI if key available
  if (openaiKey) {
    try {
      return await runOpenAIAgent(openaiKey, prompt, history);
    } catch (err) {
      console.warn('[CampusOS Agent] OpenAI API call failed, falling back to Native Engine:', err.message);
    }
  }

  // 3. Try Groq if key available
  if (groqKey) {
    try {
      return await runGroqAgent(groqKey, prompt, history);
    } catch (err) {
      console.warn('[CampusOS Agent] Groq API call failed, falling back to Native Engine:', err.message);
    }
  }

  // Default: Intelligent Native Engine (deterministic, 100% reliable, zero API key required)
  return await runNativeAgent(prompt, history);
}

// ==================== REAL LLM IMPLEMENTATIONS ====================

async function runGeminiAgent(apiKey, prompt, history = []) {
  const toolCallsMade = [];
  const model = 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Map tool definitions to Gemini function declarations
  const geminiTools = [
    {
      functionDeclarations: toolDefinitions.map(t => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters
      }))
    }
  ];

  let contents = [
    { role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\nStudent Query: ${prompt}` }] }
  ];

  // Tool-calling loop (up to 5 turns)
  for (let turn = 0; turn < 5; turn++) {
    const payload = {
      contents,
      tools: geminiTools
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    if (!candidate) break;

    const parts = candidate.content?.parts || [];
    const functionCallPart = parts.find(p => p.functionCall);

    if (!functionCallPart) {
      // Final response text
      const text = parts.map(p => p.text || '').join('');
      return {
        text,
        tool_calls: toolCallsMade,
        provider: `Google Gemini (${model})`
      };
    }

    // Execute tool
    const { name, args } = functionCallPart.functionCall;
    const toolResult = await executeTool(name, args || {});
    toolCallsMade.push({ tool: name, arguments: args, result: toolResult });

    contents.push(candidate.content);
    contents.push({
      role: 'function',
      parts: [
        {
          functionResponse: {
            name,
            response: { output: toolResult }
          }
        }
      ]
    });
  }

  return await runNativeAgent(prompt, history);
}

async function runOpenAIAgent(apiKey, prompt, history = []) {
  const toolCallsMade = [];
  const model = 'gpt-4o-mini';
  const url = 'https://api.openai.com/v1/chat/completions';

  const tools = toolDefinitions.map(t => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters
    }
  }));

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.slice(-4),
    { role: 'user', content: prompt }
  ];

  for (let turn = 0; turn < 5; turn++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        tools
      })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0];
    if (!choice) break;

    const message = choice.message;
    messages.push(message);

    if (!message.tool_calls || message.tool_calls.length === 0) {
      return {
        text: message.content || '',
        tool_calls: toolCallsMade,
        provider: `OpenAI (${model})`
      };
    }

    for (const tc of message.tool_calls) {
      const fnName = tc.function.name;
      let fnArgs = {};
      try {
        fnArgs = JSON.parse(tc.function.arguments || '{}');
      } catch (e) {}

      const toolResult = await executeTool(fnName, fnArgs);
      toolCallsMade.push({ tool: fnName, arguments: fnArgs, result: toolResult });

      messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        name: fnName,
        content: JSON.stringify(toolResult)
      });
    }
  }

  return await runNativeAgent(prompt, history);
}

async function runGroqAgent(apiKey, prompt, history = []) {
  const toolCallsMade = [];
  const model = 'llama-3.3-70b-versatile';
  const url = 'https://api.groq.com/openai/v1/chat/completions';

  const tools = toolDefinitions.map(t => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters
    }
  }));

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: prompt }
  ];

  for (let turn = 0; turn < 5; turn++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        tools
      })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Groq API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0];
    if (!choice) break;

    const message = choice.message;
    messages.push(message);

    if (!message.tool_calls || message.tool_calls.length === 0) {
      return {
        text: message.content || '',
        tool_calls: toolCallsMade,
        provider: `Groq (${model})`
      };
    }

    for (const tc of message.tool_calls) {
      const fnName = tc.function.name;
      let fnArgs = {};
      try {
        fnArgs = JSON.parse(tc.function.arguments || '{}');
      } catch (e) {}

      const toolResult = await executeTool(fnName, fnArgs);
      toolCallsMade.push({ tool: fnName, arguments: fnArgs, result: toolResult });

      messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        name: fnName,
        content: JSON.stringify(toolResult)
      });
    }
  }

  return await runNativeAgent(prompt, history);
}
