# PODCAST_SCRIPT_PROMPT = """Your task is to generate a complete, professional podcast transcript titled "{podcast_title} - Episode {episode_number}: {episode_subtitle}" with hosts {host_info}{guest_info}.

# CONTEXT INFORMATION FROM DOCUMENT:
# {combined_context[:5000]}

# PODCAST STRUCTURE AND REQUIREMENTS:
# 1. The podcast will have the following structure:
#    - Introduction (hosts welcome listeners, introduce the show, topics, and any guest)
#    - Main Discussion (covering these topics in order: {", ".join(self.topics)})
#    - Conclusion (summary of key points and sign-off)

# 2. Format the dialogue as follows:
#    [Speaker Name]: [Speaker's dialogue]
#    - Add a line ---END OF PODCAST--- only after the last dialogue in the podcast content.

# 3. For each topic:
#    - Create a natural transition to introduce the topic
#    - Ensure the discussion is deeply informed by the provided context
#    - Have the speakers explore different aspects of the topic
#    - Include meaningful back-and-forth dialogue, not just alternating monologues

# 4. Speaker personality guidelines:
#     {host1}: The primary host who guides the conversation, asks insightful questions, and connects topics
#     {host2}: The co-host who offers additional perspective and helps unpack complex ideas
#     guest_line = f"- {guest}: The guest expert who provides deeper insights and specialized knowledge" if guest else ""


# 5. Podcast Style Requirements:
#    - Professional but conversational tone throughout
#    - Natural dialogue that builds on previous statements
#    - Specific references to concepts from the source material
#    - Clear, accessible explanations of complex ideas
#    - Occasional thoughtful questions that advance the discussion
#    - Smooth transitions between topics
#    - No repetitive phrases or formulaic transitions
#    - No meta-commentary or explanations outside the dialogue
#    - No placeholders like [add detail here]

# 6. Markdown Formatting:
#    - Main title and episode details at the top
#    - Topic headings using ## for main sections
#    - Clean line breaks between speakers

# 7. Length:
#    - Create a substantial, in-depth podcast transcript (approximately 3000-4000 words)
#    - Aim for roughly equal coverage of each topic
#    - Ensure the introduction and conclusion are proportionally shorter

# 8. Special Message to LLM:
#    - You don't have to give any messages to the user or provide any extra text other than the podcast transcript.
#    - Strictly use the text from the provided context to generate the podcast and follow the podcast structure and requirements.
#    - Make sure podcast is grammatically correct and free from spelling errors and no hallucinations.
#    - Clearly do not make up anthing, cover all information from the provided context.
#    - Dont bold speaker names.
#    - Generate the entire podcast only once. if the podcast is done then terminate the generation process.
#    - Do not add any extra text or messages to the user in the end. I need the conversation to end naturally.

# GENERATE THE COMPLETE PODCAST TRANSCRIPT:
# """


PODCAST_SCRIPT_PROMPT = """Your task is to generate a complete, professional podcast transcript titled "{podcast_title} - Episode {episode_number}: {episode_subtitle}" with hosts {host_info}{guest_info}.

CONTEXT INFORMATION FROM DOCUMENT:
{combined_context}

PODCAST STRUCTURE AND REQUIREMENTS:
1. The podcast will have the following structure:
   - Introduction (hosts welcome listeners, introduce the show, topics, and any guest)
   - Main Discussion (covering these topics in order: {topics})
   - Conclusion (summary of key points and sign-off)

2. Format the dialogue as follows:
   [Speaker Name]: [Speaker's dialogue]
   - Add a line ---END OF PODCAST--- only after the last dialogue in the podcast content.

3. For each topic:
   - Create a natural transition to introduce the topic
   - Ensure the discussion is deeply informed by the provided context
   - Have the speakers explore different aspects of the topic
   - Include meaningful back-and-forth dialogue, not just alternating monologues

4. Speaker personality guidelines:
    {host1}: The primary host who guides the conversation, asks insightful questions, and connects topics
    {host2}: The co-host who offers additional perspective and helps unpack complex ideas
    {guest_line}

    SPEAKER EMOTIONAL ALIGNMENTS:
    {speaker_tone_descriptions}


5. Podcast Style Requirements:
   - Professional but conversational tone throughout
   - Natural dialogue that builds on previous statements
   - Specific references to concepts from the source material
   - Clear, accessible explanations of complex ideas
   - Occasional thoughtful questions that advance the discussion
   - Smooth transitions between topics
   - No repetitive phrases or formulaic transitions
   - No meta-commentary or explanations outside the dialogue
   - No placeholders like [add detail here]

6. Markdown Formatting:
   - Main title and episode details at the top
   - Topic headings using ## for main sections
   - Clean line breaks between speakers

7. Length:
   - Create a substantial, in-depth podcast transcript (approximately 3000–4000 words)
   - Aim for roughly equal coverage of each topic
   - Ensure the introduction and conclusion are proportionally shorter

8. Special Message to LLM:
   - You don't have to give any messages to the user or provide any extra text other than the podcast transcript.
   - Strictly use the text from the provided context to generate the podcast and follow the podcast structure and requirements.
   - Make sure podcast is grammatically correct and free from spelling errors and no hallucinations.
   - Clearly do not make up anything; cover all information from the provided context.
   - Do not bold speaker names.
   - Generate the entire podcast only once. If the podcast is done, then terminate the generation process.
   - Do not add any extra text or messages to the user in the end. I need the conversation to end naturally.

GENERATE THE COMPLETE PODCAST TRANSCRIPT:
"""
