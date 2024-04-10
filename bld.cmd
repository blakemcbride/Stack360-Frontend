@echo off

REM Check if Java source files are newer than their respective class files
if NOT EXIST "builder\builder\Tasks.class" goto compile
if NOT EXIST "builder\builder\BuildUtils.class" goto compile
for %%A in (builder\builder\Tasks.java builder\builder\BuildUtils.java) do (
    if "%%~tA" gtr "%%~dpnA.class" goto compile
)

goto run

:compile
cd builder
javac -cp "libs/*" builder\*.java
cd ..

:run
java -cp "builder;builder\libs\*" builder.BuildUtils %*
