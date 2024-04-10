@echo off
REM Delete existing JAR files
del ..\Stack360Frontend.jar
del Stack360Frontend.jar

REM Create filelist.txt with exclusions
(for /r %%i in (*.*) do (
    echo %%i | findstr /v /i /r "Stack360Frontend\.iml makedist serve SimpleWebServer\.jar notes builder WhiteLabel build\.xml \.idea \.svn nbproject .*\.tar\.gz ^\.\/bld$ ^\.\/bld\.cmd$ ^\.\/expand$" >nul || echo %%i
)) > filelist.txt

REM Create the JAR file
jar cf ..\Stack360Frontend.jar @filelist.txt
del filelist.txt

REM Move the JAR file to the current directory
move ..\Stack360Frontend.jar .
