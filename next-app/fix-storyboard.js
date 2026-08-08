const fs = require('fs');
const filePath = 'C:\\\\Users\\\\HC\\\\Desktop\\\\viral clip\\\\YouTube-Viral-Intelligence\\\\next-app\\\\src\\\\components\\\\studio\\\\panels\\\\storyboard-panel.tsx';
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

const startIdx = 633; // 0-indexed for line 634
const endIdx = 871;   // 0-indexed for line 872

const newContent = `                  {!isDragging && project.sections.length > 20 ? (
                    <VirtualizedSceneList
                      items={project.sections}
                      renderItem={(section, index) => (
                        <SceneCard
                          section={section}
                          index={index}
                          isExpanded={expandedScenes[section.id] !== false}
                          toggleSceneExpanded={toggleSceneExpanded}
                          updateSection={updateSection}
                          handleContentChange={handleContentChange}
                          globalTheme={globalTheme}
                        />
                      )}
                    />
                  ) : (
                    project.sections.map((section, index) => (
                      <Draggable key={section.id} draggableId={section.id} index={index}>
                        {(provided: any) => (
                          <SceneCard
                            section={section}
                            index={index}
                            isExpanded={expandedScenes[section.id] !== false}
                            toggleSceneExpanded={toggleSceneExpanded}
                            updateSection={updateSection}
                            handleContentChange={handleContentChange}
                            globalTheme={globalTheme}
                            provided={provided}
                          />
                        )}
                      </Draggable>
                    ))
                  )}`;

lines.splice(startIdx, endIdx - startIdx, newContent);

fs.writeFileSync(filePath, lines.join('\n'));
console.log('Done!');
